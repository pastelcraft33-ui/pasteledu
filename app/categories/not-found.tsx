import Link from "next/link";

export default function CategoryNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-bold">카테고리를 찾을 수 없습니다.</h1>
      <p className="text-sm text-gray-500">삭제되었거나 해당 분류에 속하지 않는 카테고리입니다.</p>
      <div className="flex flex-wrap justify-center gap-4 text-sm font-semibold underline underline-offset-4">
        <Link href="/categories/month">월별 전체보기</Link>
        <Link href="/categories/subject">주제별 전체보기</Link>
        <Link href="/">메인으로 돌아가기</Link>
      </div>
    </main>
  );
}
