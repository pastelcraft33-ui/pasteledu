# Pastel PPT Library

Pastel PPT Library는 파스텔크래프트용 PPT 자료 업로드/공유 서비스입니다.
관리자는 PPT/PPTX 자료를 업로드하고, 카테고리, 썸네일, 순서, 사이트 문구, 디자인 값을 관리할 수 있습니다.
일반 사용자는 로그인 없이 메인 자료실에서 자료를 검색하고 다운로드할 수 있습니다.

## 사용 기술

- Next.js
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase Database
- Supabase Storage
- Vercel

## 주요 화면

- `/`: 공개 PPT 자료실
- `/login`: 관리자 로그인
- `/admin`: 관리자 페이지

## 로컬 실행 방법

```bash
npm install
npm run dev
```

터미널에 표시되는 로컬 개발 주소로 접속합니다.

## 환경변수 설정

프로젝트 루트에 `.env.local` 파일을 만들고 아래 내용을 넣습니다.

```bash
NEXT_PUBLIC_SUPABASE_URL=https://nwkxpcqjtmhsuakgupjn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_wstJyrjPLsQvcoe5vcoudw_0nmit6DZ
```

`.env.local.example`에도 같은 예시 값이 들어 있습니다.

주의:
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`는 공개되어도 되는 Supabase publishable/anon key입니다.
- `service_role` key는 절대 넣지 마세요.
- `NEXT_PUBLIC_`이 붙은 환경변수는 브라우저에 노출됩니다. 여기에 비밀키를 넣으면 안 됩니다.
- `.env.local`은 `.gitignore`에 포함되어 있으므로 GitHub에 올리지 않습니다.

환경변수가 빠지면 앱에서 다음처럼 명확한 오류가 나도록 처리되어 있습니다.

```text
Supabase 환경변수가 설정되지 않았습니다. .env.local 또는 Vercel Environment Variables를 확인해주세요.
```

## Supabase SQL 실행 방법

1. Supabase Dashboard에 접속합니다.
2. 왼쪽 메뉴에서 SQL Editor로 이동합니다.
3. 이 프로젝트의 `supabase/schema.sql` 파일 전체 내용을 복사합니다.
4. SQL Editor에 붙여넣습니다.
5. Run을 클릭합니다.

`supabase/schema.sql`에는 다음 내용이 포함되어 있습니다.

- `pgcrypto` extension
- `categories` 테이블
- `ppt_materials` 테이블
- `site_settings` 테이블
- `updated_at` 자동 갱신 함수와 trigger
- 초기 카테고리 seed 데이터
- 초기 사이트 설정 seed 데이터
- RLS 활성화
- 일반 사용자 select 정책
- 로그인 사용자 insert/update/delete 정책
- `ppt-files`, `thumbnails`, `site-assets` Storage 버킷 생성 SQL
- Storage public read 정책
- Storage authenticated upload/update/delete 정책

## Storage 버킷 확인 방법

Supabase Dashboard에서 아래 순서로 확인합니다.

1. Supabase Dashboard 접속
2. Storage 이동
3. Buckets 이동
4. 아래 3개 버킷이 있는지 확인

- `ppt-files`
- `thumbnails`
- `site-assets`

각 버킷은 Public bucket이어야 합니다.
SQL 실행으로 버킷 생성이 실패했다면 Supabase Dashboard에서 직접 세 버킷을 만들고 Public bucket으로 설정한 뒤, `supabase/schema.sql`의 Storage policy 구문을 다시 실행합니다.

## 관리자 계정 생성 방법

1. Supabase Dashboard에 접속합니다.
2. Authentication으로 이동합니다.
3. Users로 이동합니다.
4. Add user를 클릭합니다.
5. 관리자 이메일과 비밀번호를 생성합니다.

현재 앱 로그인 화면은 아래 이메일만 관리자 로그인 ID로 허용합니다.

```text
pastelcraft3@naver.com
```

중요:
- 비밀번호는 코드에 저장하지 않습니다.
- Supabase Authentication에서 직접 설정한 비밀번호로 로그인합니다.
- 이메일 인증이 필요한 상태라면 Supabase에서 Confirm 처리하거나 Auto Confirm 옵션을 사용하세요.
- 현재 1차 버전의 RLS 정책은 Supabase Auth에 로그인한 사용자를 관리자 권한으로 간주합니다.
- 앱 화면에서는 `pastelcraft3@naver.com`만 `/admin`에 접근하도록 한 번 더 제한합니다.
- 추가 Auth 사용자를 만들면 RLS 기준으로는 관리 권한을 가질 수 있으니, 꼭 필요한 관리자 계정만 생성하세요.

## 배포 전 확인 명령어

```bash
npm run lint
npm run build
```

`npm run build`가 통과해야 Vercel 배포 가능성이 높습니다.

## 카테고리가 안 보일 때 확인할 것

1. Supabase Dashboard에 접속합니다.
2. SQL Editor에서 `supabase/schema.sql`을 실행했는지 확인합니다.
3. Table Editor에서 `categories` 테이블에 데이터가 있는지 확인합니다.
4. `site_settings` 테이블에 1개 행이 있는지 확인합니다.
5. `.env.local`에 아래 값이 들어있는지 확인합니다.

```bash
NEXT_PUBLIC_SUPABASE_URL=https://nwkxpcqjtmhsuakgupjn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_wstJyrjPLsQvcoe5vcoudw_0nmit6DZ
```

6. RLS 정책이 실행되었는지 확인합니다.
7. 브라우저를 새로고침합니다.
8. 로컬 서버를 재시작합니다.

```bash
npm run dev
```

## 업로드가 안 될 때 확인할 것

- Supabase Storage에 `ppt-files`, `thumbnails`, `site-assets` 버킷이 있는지 확인합니다.
- 각 버킷이 Public bucket인지 확인합니다.
- Storage 정책이 실행되었는지 확인합니다.
- 관리자 계정으로 로그인되어 있는지 확인합니다.
- PPT 파일은 `ppt` 또는 `pptx`만 가능합니다.
- 썸네일 이미지는 `jpg`, `jpeg`, `png`, `webp`만 가능합니다.
- 로고/파비콘은 사이트 정보 설정에서 업로드합니다.
- 업로드 후 public URL이 DB에 저장되어야 메인 화면에 표시됩니다.

## Vercel 배포 준비

1. GitHub에 코드를 업로드합니다.
2. Vercel에 로그인합니다.
3. New Project를 클릭합니다.
4. GitHub 저장소를 선택합니다.
5. Framework Preset이 `Next.js`인지 확인합니다.
6. Environment Variables에 아래 값을 입력합니다.

```bash
NEXT_PUBLIC_SUPABASE_URL=https://nwkxpcqjtmhsuakgupjn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_wstJyrjPLsQvcoe5vcoudw_0nmit6DZ
```

7. Deploy를 실행합니다.
8. 배포 완료 후 제공되는 URL에 접속합니다.
9. `/` 페이지에서 카테고리와 자료실 화면을 확인합니다.
10. `/login` 페이지에 접속합니다.
11. 관리자 로그인 후 `/admin`으로 이동되는지 확인합니다.
12. `/admin`에서 PPT 업로드를 테스트합니다.
13. 메인 화면에서 업로드한 자료가 보이는지 확인합니다.

주의:
- Vercel Environment Variables에도 `service_role` key를 넣지 마세요.
- Supabase Dashboard의 Site URL 또는 Redirect URL 설정이 필요한 경우 배포 URL을 추가하세요.
- 이 프로젝트의 파일 업로드는 Vercel 서버 파일 시스템을 사용하지 않고 Supabase Storage에 직접 저장됩니다.

## 보안 안내

- `NEXT_PUBLIC_SUPABASE_ANON_KEY`는 공개되어도 되는 키입니다.
- `service_role` key는 절대 프론트엔드 코드에 넣지 마세요.
- `service_role` key는 절대 GitHub에 올리지 마세요.
- 관리자 계정은 꼭 필요한 사람에게만 공유하세요.
- 현재 1차 버전은 Supabase Auth에 로그인한 사용자를 RLS 기준 관리자라고 간주합니다.
- 앱 로그인 화면과 `/admin`에서는 `pastelcraft3@naver.com`만 접근하도록 추가 제한합니다.
- 더 강한 권한 관리가 필요하면 추후 `admin_roles` 테이블을 추가해야 합니다.

## 배포 후 기본 테스트

1. `/` 메인 자료실이 열리는지 확인합니다.
2. 카테고리 컬럼이 보이는지 확인합니다.
3. `/login`에서 관리자 계정으로 로그인합니다.
4. `/admin`에 접근되는지 확인합니다.
5. PPT 자료를 1개 업로드합니다.
6. 썸네일을 업로드합니다.
7. 메인 화면에서 자료 카드와 썸네일이 보이는지 확인합니다.
8. 다운로드 버튼이 열리는지 확인합니다.
9. 모바일 화면에서 가로 스크롤이 깨지지 않는지 확인합니다.
