// ── Static mock data (to be replaced by API calls) ───────────────
import type { Keyword, Review, Category } from '@/types'
import { COLORS } from '@/constants'

export const mockKeywords: Keyword[] = [
  { text: '閃退',       count: 28 },
  { text: '黑心抽卡',   count: 24 },
  { text: '機率詐騙',   count: 21 },
  { text: '連線錯誤',   count: 19 },
  { text: '掉線',       count: 17 },
  { text: '延遲嚴重',   count: 13 },
  { text: '客服不回',   count: 14 },
  { text: '更新Bug',    count: 11 },
  { text: '帳號異常',   count: 9  },
  { text: '退款問題',   count: 8  },
  { text: '活動不公平', count: 7  },
  { text: '廣告太多',   count: 6  },
  { text: '強制下載',   count: 5  },
  { text: '卡關',       count: 4  },
]

export const mockCategories: Category[] = [
  { category: '抽卡/中獎機率', count: 45, color: COLORS.critical, riskLevel: 'critical' },
  { category: '客服/帳號',     count: 31, color: COLORS.warning,  riskLevel: 'warning'  },
  { category: '系統Bug/連線',  count: 23, color: COLORS.warning,  riskLevel: 'warning'  },
  { category: '活動設計',      count: 18, color: COLORS.info,     riskLevel: 'info'     },
  { category: '其他',          count: 12, color: COLORS.info,     riskLevel: 'info'     },
]

export const mockHighRiskReviews: Review[] = [
  {
    id: 'r001',
    playerName: '小花花',
    date: '2026-04-11',
    stars: 2,
    text: '課了三萬塊，連一個SSR都沒抽到！這機率是假的！已向消保委投訴！',
  },
  {
    id: 'r002',
    playerName: '憤怒的玩家001',
    date: '2026-04-10',
    stars: 1,
    text: '公告說3%但我連抽了200發都沒出，這不是詐欺是什麼？立刻退款！',
  },
  {
    id: 'r003',
    playerName: 'GameReviewer_TW',
    date: '2026-04-11',
    stars: 1,
    text: '機率存在嚴重問題，內部數據顯示實際出貨率可能僅0.8%，建議玩家集體向主管機關申訴。',
  },
]
