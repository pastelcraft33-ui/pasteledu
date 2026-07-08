type Props = {
  value: string;
  onChange: (value: string) => void;
  resultCount: number;
  showResultCount: boolean;
  borderColor: string;
};

export default function SearchBar({ value, onChange, resultCount, showResultCount, borderColor }: Props) {
  return (
    <div className="w-full max-w-3xl">
      <label className="block">
        <span className="sr-only">자료 검색</span>
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="PPT 제목, 설명, 태그 검색"
          className="w-full rounded-md border-2 bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm outline-none ring-0 transition placeholder:font-medium placeholder:text-gray-500 focus:border-gray-900 focus:shadow-md sm:px-5 sm:py-4 sm:text-base"
          style={{ borderColor }}
        />
      </label>
      {showResultCount ? <p className="mt-2 text-sm font-semibold opacity-70 sm:text-base">검색 결과 {resultCount}개</p> : null}
    </div>
  );
}
