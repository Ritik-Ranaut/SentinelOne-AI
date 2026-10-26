import pytest
from app.models.state import SOCWorkflowState
from app.graphs.soc_graph import soc_agent_graph
from app.agents import risk_scorer
from app.routes import health


@pytest.mark.asyncio
async def test_health_reports_provider_and_model_availability(monkeypatch):
    monkeypatch.setenv("AI_PROVIDER", "ollama")
    monkeypatch.setenv("OLLAMA_MODEL", "qwen3:8b")
    monkeypatch.setenv("OLLAMA_BASE_URL", "http://ollama.test")

    class MockResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return {"models": [{"name": "qwen3:8b"}]}

    class MockAsyncClient:
        def __init__(self, timeout):
            self.timeout = timeout

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return None

        async def get(self, url):
            assert url == "http://ollama.test/api/tags"
            return MockResponse()

    monkeypatch.setattr(health.httpx, "AsyncClient", MockAsyncClient)
    result = await health.health_check()

    assert result["status"] == "HEALTHY"
    assert result["providerStatus"] == "AVAILABLE"
    assert result["fallbackAvailable"] is True


@pytest.mark.asyncio
async def test_risk_explanation_source_marks_deterministic_fallback(monkeypatch):
    class FailingProvider:
        async def generate_text(self, prompt, system_prompt=None):
            raise RuntimeError("provider offline")

    monkeypatch.setattr(risk_scorer, "get_llm_provider", lambda: FailingProvider())
    result = await risk_scorer.evaluate_risk(SOCWorkflowState(incident_id="TEST-SOURCE"))

    assert result["explanation_source"] == "DETERMINISTIC_FALLBACK"
    assert result["risk_score"] == 15

@pytest.mark.asyncio
async def test_langgraph_workflow_bruteforce():
    state = SOCWorkflowState(
        incident_id="TEST-INC-101",
        raw_logs=[
            {"eventType": "LOGIN_FAILED", "username": "admin", "sourceIp": "185.220.101.42", "severity": "MEDIUM"},
            {"eventType": "LOGIN_FAILED", "username": "admin", "sourceIp": "185.220.101.42", "severity": "HIGH"},
            {"eventType": "LOGIN_FAILED", "username": "admin", "sourceIp": "185.220.101.42", "severity": "HIGH"},
            {"eventType": "LOGIN_SUCCESS", "username": "admin", "sourceIp": "185.220.101.42", "severity": "CRITICAL"},
            {"eventType": "ADMIN_ACCESS", "username": "admin", "sourceIp": "185.220.101.42", "severity": "CRITICAL"}
        ],
        context={"user": "admin", "ip": "185.220.101.42", "type": "BRUTE_FORCE"}
    )

    result = await soc_agent_graph.ainvoke(state)
    result_dict = result.dict() if hasattr(result, "dict") else dict(result)

    assert result_dict["is_suspicious"] is True
    assert result_dict["risk_score"] >= 60
    assert len(result_dict["recommendations"]) > 0
    assert len(result_dict["timeline"]) == 5
    assert len(result_dict["risk_breakdown"]) >= 3
    assert "historical_findings" in result_dict
    assert result_dict["requires_human_approval"] is True
    assert result_dict["approval_status"] == "WAITING_APPROVAL"
    assert len(result_dict["agent_executions"]) >= 8
    assert result_dict["status"] == "COMPLETED"

@pytest.mark.asyncio
async def test_normal_activity_workflow():
    state = SOCWorkflowState(
        incident_id="TEST-INC-NORM",
        raw_logs=[
            {"eventType": "LOGIN_SUCCESS", "username": "rachel.green", "sourceIp": "10.10.1.20", "severity": "NORMAL"},
            {"eventType": "FILE_ACCESS", "username": "rachel.green", "sourceIp": "10.10.1.20", "severity": "NORMAL"}
        ],
        context={"user": "rachel.green"}
    )

    result = await soc_agent_graph.ainvoke(state)
    result_dict = result.dict() if hasattr(result, "dict") else dict(result)

    # Should detect as normal activity and not proceed to attack investigation
    assert result_dict["is_suspicious"] is False
    assert result_dict["status"] == "COMPLETED"
    assert result_dict["risk_score"] == 5
    assert result_dict["severity"] == "LOW"
    assert result_dict["requires_human_approval"] is False
    assert result_dict["approval_status"] == "NOT_REQUIRED"
