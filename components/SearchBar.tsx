type Props = {
  value: string;
  onChange: (value: string) => void;
  resultCount: number;
  showResultCount: boolean;
  borderColor: string;
};

export default function SearchBar({ value, onChange, resultCount, showResultCount, borderColor }: Props) {
  return (
    <div className="max-w-2xl">
      <label className="block">
        <span className="sr-only">자료 검색</span>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="PPT 제목, 설명, 태그 검색"
          className="w-full rounded-md border bg-white px-4 py-3 text-sm text-gray-900 outline-none ring-0 transition focus:border-gray-900"
          style={{ borderColor }}
        />
      </label>
      {showResultCount ? <p className="mt-2 text-sm opacity-70">검색 결과 {resultCount}개</p> : null}
    </div>
  );
}
