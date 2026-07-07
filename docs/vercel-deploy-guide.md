# Vercel 배포 가이드

Pastel PPT Library를 Vercel에 배포하는 순서입니다.

## 1. GitHub에 프로젝트 업로드

1. GitHub에 새 저장소를 만듭니다.
2. 이 프로젝트 코드를 GitHub 저장소에 업로드합니다.
3. `.env.local` 파일은 업로드하지 않습니다.

## 2. Vercel 접속

1. Vercel에 로그인합니다.
2. 대시보드에서 `New Project`를 클릭합니다.
3. GitHub 저장소 목록에서 Pastel PPT Library 저장소를 선택합니다.

## 3. 프로젝트 설정 확인

1. Framework Preset이 `Next.js`인지 확인합니다.
2. Build Command는 기본값인 `next build`를 사용합니다.
3. Install Command는 기본값인 `npm install`을 사용합니다.

## 4. Environment Variables 추가

Vercel 프로젝트 설정의 Environment Variables에 아래 값을 추가합니다.

```bash
NEXT_PUBLIC_SUPABASE_URL=https://nwkxpcqjtmhsuakgupjn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_wstJyrjPLsQvcoe5vcoudw_0nmit6DZ
```

주의:

- `service_role` key는 절대 넣지 마세요.
- `NEXT_PUBLIC_` 환경변수는 브라우저에 노출될 수 있습니다.
- 이 프로젝트에서는 Supabase publishable key만 사용합니다.

## 5. Deploy 실행

1. `Deploy` 버튼을 클릭합니다.
2. 빌드가 끝날 때까지 기다립니다.
3. 배포 완료 후 Vercel이 제공하는 URL을 엽니다.

## 6. 배포 후 기본 확인

1. `/` 페이지에서 메인 자료실이 열리는지 확인합니다.
2. 카테고리 컬럼이 보이는지 확인합니다.
3. 오른쪽 위 로그인 버튼이 보이는지 확인합니다.
4. `/login` 페이지에 접속합니다.
5. 관리자 계정으로 로그인합니다.
6. 로그인 성공 후 `/admin`으로 이동하는지 확인합니다.
7. `/admin`에서 PPT 단일 업로드를 테스트합니다.
8. `/admin`에서 PPT 대량 업로드를 테스트합니다.
9. 썸네일 업로드를 테스트합니다.
10. `/` 메인 화면에서 업로드한 자료가 보이는지 확인합니다.
11. 다운로드 버튼이 정상 작동하는지 확인합니다.

## 7. Supabase에서 함께 확인할 것

- `categories` 테이블에 데이터가 있어야 합니다.
- `site_settings` 테이블에 1개 행이 있어야 합니다.
- `ppt-files`, `thumbnails`, `site-assets` 버킷이 있어야 합니다.
- 세 버킷은 Public bucket이어야 합니다.
- RLS 정책이 `supabase/schema.sql` 기준으로 실행되어 있어야 합니다.
- Authentication Users에 관리자 계정이 있어야 합니다.

## 8. 문제가 생겼을 때

- 카테고리가 안 보이면 `supabase/schema.sql` 실행 여부를 확인합니다.
- 업로드가 안 되면 Storage 버킷과 Storage 정책을 확인합니다.
- 로그인이 안 되면 Supabase Authentication Users에 관리자 계정이 있는지 확인합니다.
- Vercel에서 환경변수를 수정했다면 다시 Deploy를 실행합니다.
