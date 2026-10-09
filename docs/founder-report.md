# Founder report — 2026-10-08

- **오늘의 문제:** npm dependency update를 버전·lockfile만 보고 승인하면 install-time lifecycle hook 변화가 눈에 묻힌다.
- **첫 사용자:** JavaScript maintainer와 AI가 제안한 dependency를 검토하는 개발자.
- **해결 방법:** 두 package directory 또는 `.tgz`를 정적 비교해 install hook, capability signal, dependency/file delta를 한 화면에 보여준다.
- **기존 방식과 다른 점:** 일반 파일 diff/lockfile review가 아니라 “승인 전 trust-surface delta”에 초점을 맞춘다.
- **만든 MVP:** `supplydelta diff`, `--json`, `--fail-on install-script`, guarded `.tgz` inspection.
- **실행 방법:** `npm pack --ignore-scripts ...` 후 `npx supplydelta diff before.tgz after.tgz`.
- **사용자에게 줄 가치:** package update를 승인하기 전에 무엇이 달라졌는지 빠르게 판단하고, CI에서 lifecycle hook 변화를 gate한다.
- **수익 모델 가설:** CLI는 MIT/free; 요청이 확인될 때만 policy history/team reporting을 별도 검토한다.
- **확인된 사실:** npm lifecycle hook이 install boundary에서 실행될 수 있고, adjacent tooling은 서로 다른 review surface를 다룬다.
- **아직 검증되지 않은 가설:** maintainer가 trust-surface delta를 반복 사용하고 `--fail-on`을 CI에 유지할지는 사용자 실험이 필요하다.
- **오늘의 희망 근거:** 결과가 눈에 보이는 before/after 카드이고, 실행하지 않는 read-only boundary라 첫 사용 장벽이 낮다.
- **내일의 단 하나의 실험:** JavaScript maintainer 5명에게 fixture diff를 보내 “승인/보류 판단이 바뀌었는가?”를 묻는다.
- **GitHub 공개 URL:** pending until remote publication.
- **commit·CI·release 결과:** pending final verification.

