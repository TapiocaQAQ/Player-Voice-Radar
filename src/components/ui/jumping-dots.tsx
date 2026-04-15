/** 三個交錯跳動的小圓點，用於 Loading 訊息結尾取代靜態的 "..." */
export function JumpingDots() {
  return (
    <span className="inline-flex items-end gap-[3px] ml-[2px] translate-y-[-1px]">
      <span
        className="w-[3px] h-[3px] rounded-full bg-current animate-dot-bounce"
        style={{ animationDelay: "0ms" }}
      />
      <span
        className="w-[3px] h-[3px] rounded-full bg-current animate-dot-bounce"
        style={{ animationDelay: "150ms" }}
      />
      <span
        className="w-[3px] h-[3px] rounded-full bg-current animate-dot-bounce"
        style={{ animationDelay: "300ms" }}
      />
    </span>
  )
}
