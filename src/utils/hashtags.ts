// 覆蓋能力用 hashtag 表示：不支援空白（當作多個標籤的分隔符）、不限字數、
// 可以一次輸入多個。空白分隔完若有空字串（例如輸入全是空白）就濾掉
export function parseHashtags(text: string): string[] {
  return text.split(/\s+/).map(t => t.trim()).filter(Boolean)
}
