# Threat Simulation Engine

## Overview

The Simulation Center allows operators and reviewers to observe the complete autonomous SOC lifecycle in action without connecting to real infrastructure or running real network attacks.

## Simulated Scenarios

1. **Brute-Force Authentication (`BRUTE_FORCE`)**:
   - 5 successive failed login attempts targeting `admin` from a German Tor exit node (`185.220.101.42`), followed by a successful login and immediate access to `/admin/security-policies`.
   - **Mitigation Playbook**: Perimeter edge IP drop + User session revocation.

2. **Suspicious Login Anomaly (`SUSPICIOUS_LOGIN`)**:
   - Authentication at 03:22 AM from a residential proxy subnet in Bucharest (`45.154.255.89`) with an unrecognized user-agent, accessing restricted financial forecasts.
   - **Mitigation Playbook**: Out-of-band identity challenge + Token invalidation.

3. **Privilege Escalation (`PRIVILEGE_ESCALATION`)**:
   - Junior developer account (`jason.dev`) probing IAM roles and modifying user permissions from `VIEWER` to `DOMAIN_ADMIN`, followed by production key dumping.
   - **Mitigation Playbook**: Immediate account suspension + IAM role rollback.

4. **Data Exfiltration / Large Transfer (`DATA_EXFILTRATION`)**:
   - Sensitive PII database query followed by a 4.8 GB outbound encrypted archive transfer to an untrusted external IP (`194.26.29.112`).
   - **Mitigation Playbook**: Edge firewall DROP rule + Host EDR isolation.

5. **Port Scan Simulation (`PORT_SCAN`)**:
   - Rapid sequential TCP SYN probing targeting ports 21, 22, 80, 443, 445, 3389 across the internal 10.0.0.0/16 subnet.
   - **Mitigation Playbook**: Switchport quarantine + Intrusion prevention rule.

6. **Impossible Travel Anomaly (`IMPOSSIBLE_TRAVEL`)**:
   - Interactive login in San Francisco followed 8 minutes later by an authenticated session in Tokyo (5,140 miles apart).
   - **Mitigation Playbook**: Session termination + Hardware MFA challenge.

7. **Abnormal API Activity (`ABNORMAL_API`)**:
   - Automated token fuzzing and SQL parameter tampering triggering high-frequency 401 and 403 status spikes.
   - **Mitigation Playbook**: API rate-limiting + WAF signature update.

## Simulation Safety Guarantee

All simulated attack scenarios generate purely synthetic in-memory telemetry records inserted into MongoDB and streamed over WebSockets. No offensive network probes, port scanners, exploits, or malicious code are ever executed.
