# claude-mem Worker 子程序退出 Code 1 - 修 BUG 完整報告

**報告日期**: 2026-04-16
**工程師**: Claude Code (AI)
**目標專案**: claude-mem v12.1.5 (https://github.com/thedotmack/claude-mem)
**修復檔案數**: 2 個 `worker-service.cjs` + 1 個 `settings.json`
**結果**: ✅ 修復成功 (Worker 正常運作，MEMORY_ID_CAPTURED)

---

## 一、問題現象

安裝 claude-mem v12.1.5 後啟動 worker，Log 持續出現：

```
[ERROR] [SESSION] [session-1] Claude Code process exited with code 1
[WARN ] [SESSION] [session-1] Session ended unexpectedly
[ERROR] [PROCESS] Memory session worker crashed
```

每次新建 session 就炸一次，完全無法使用 claude-mem 的觀察記錄功能。

---

## 二、排查歷程 (Debugging Journey)

### Step 1 — 初始假設：`CLAUDE_CODE_PATH` 空值
查看 `C:\Users\john\.claude-mem\settings.json` 發現 `CLAUDE_CODE_PATH` 欄位為空字串。

**假設**：worker 找不到 `claude.exe` 執行檔。
**動作**：改成 VSCode Extension 內建 claude binary 的絕對路徑：
```
C:\Users\john\.vscode\extensions\anthropic.claude-code-2.1.109-win32-x64\resources\native-binary\claude.exe
```

**結果**：仍然 exit code 1。❌ 假設錯誤。

---

### Step 2 — 第二假設：`CLAUDECODE=1` 造成遞迴啟動
claude CLI 內部會檢查 `CLAUDECODE` 環境變數避免自我巢狀呼叫。

**假設**：父程序把 `CLAUDECODE=1` 傳下去導致子 claude 拒絕執行。
**動作**：閱讀 claude-mem 原始碼 `src/supervisor/env-sanitizer.ts`：

```typescript
const ENV_EXACT_MATCHES = [
  'CLAUDECODE',      // ← 已在黑名單
  'ANTHROPIC_API_KEY',
  ...
];
```

**結果**：claude-mem 早就過濾掉了，這條路走不通。❌ 假設錯誤。

---

### Step 3 — 第三假設：缺少 OAuth 認證
檢查 `src/shared/EnvManager.ts` 的 `buildIsolatedEnv()`，看到它會傳遞 `CLAUDE_CODE_OAUTH_TOKEN`。

**假設**：沒設 OAuth token 導致 claude CLI 無法認證。
**動作**：檢查用戶現有訂閱認證狀態。

**結果**：用戶已正常訂閱，VSCode Extension 本身能用 claude，Token 是生效的。❌ 假設錯誤。

---

### Step 4 — 打開 DEBUG 日誌挖真相
改 `CLAUDE_MEM_LOG_LEVEL` 為 `"DEBUG"`，重啟 worker 後終於抓到關鍵 stderr：

```
error: unknown option '--permission-mode'
    at node:internal/commander/...
    at /c/Users/john/.claude/plugins/cache/thedotmack/claude-mem/12.1.5/scripts/worker-service.cjs:XXXX
```

**重大發現**：
1. claude CLI 不認識 `--permission-mode` 參數 ← **這不合理**，因為此參數是 SDK 標準 flag。
2. 觸發位置不是 `marketplaces/` 目錄，而是 **`plugins/cache/`** ← 之前只看 `marketplaces` 是錯的路徑。

---

### Step 5 — 定位真正的 Bug
檢查 `worker-service.cjs` 的 SDK 參數組裝邏輯：

```javascript
S&&j.push("--setting-sources",S.join(","))
j.push("--permission-mode", P)
```

這段程式有個致命缺陷：當 `S`（settingSources 陣列）**存在但為空 `[]`** 時：
- `S && ...` 判定為 truthy（因為 `[]` 是 truthy）
- 執行 `S.join(",")` 回傳空字串 `""`
- 結果變成 `claude --setting-sources "" --permission-mode plan ...`
- claude CLI 把下一個參數 `--permission-mode` 當成 `--setting-sources` 的值吸收掉
- 再遇到 `plan` 這個位置參數時丟 `unknown option` 錯誤

---

### Step 6 — 對照 GitHub Issue
Google 搜尋 `claude-agent-sdk setting-sources permission-mode`，找到 **Issue #2049**：

> "Empty settingSources array causes `--setting-sources` flag to consume the next argument, breaking `--permission-mode`."

確認是上游 SDK 已知 bug，claude-mem v12.1.5 踩到了。

---

## 三、修復方案

### 3.1 一行 Patch — 兩個檔案都要打

**修補點**：加上 `S.length > 0` 的守衛。

| 路徑 | 修補前 | 修補後 |
|------|--------|--------|
| `C:\Users\john\.claude\plugins\marketplaces\thedotmack\plugin\scripts\worker-service.cjs` | `S&&j.push("--setting-sources",S.join(","))` | `S&&S.length>0&&j.push("--setting-sources",S.join(","))` |
| `C:\Users\john\.claude\plugins\cache\thedotmack\claude-mem\12.1.5\scripts\worker-service.cjs` | 同上 | 同上 |

**⚠️ 關鍵教訓**：只改 `marketplaces/` 沒用。Claude Code plugin 系統實際載入的是 **`plugins/cache/<author>/<plugin>/<version>/`** 的副本。兩份都要同步修補。

**patch 指令範例**（bash）：
```bash
sed -i 's/S&&j\.push("--setting-sources",S\.join(","))/S\&\&S.length>0\&\&j.push("--setting-sources",S.join(","))/g' worker-service.cjs
```

---

### 3.2 埠號遷移 — 避開 Windows ghost socket

DEBUG 過程中反覆重啟 worker，Windows 把死 PID 的 TCP socket 卡在 `FIN_WAIT_2` / `CLOSE_WAIT`：

| 埠號 | 殘留 PID | 狀態 |
|------|----------|------|
| 37777 | 31944 | 殭屍 LISTENING |
| 37778 | 28784 | 殭屍 LISTENING |
| 37780 | 32216 | 殭屍 LISTENING |
| **38000** | — | **乾淨** ✅ |

**動作**：修改 `settings.json`：
```json
"CLAUDE_MEM_WORKER_PORT": "38000"
```

---

### 3.3 最終 `settings.json` 關鍵欄位

```json
{
  "CLAUDE_MEM_WORKER_PORT": "38000",
  "CLAUDE_CODE_PATH": "C:\\Users\\john\\.vscode\\extensions\\anthropic.claude-code-2.1.109-win32-x64\\resources\\native-binary\\claude.exe",
  "CLAUDE_MEM_LOG_LEVEL": "DEBUG"
}
```

---

## 四、驗證結果

重啟 worker 後日誌顯示成功訊號：

```
[INFO ] [DB    ] Registered memory_session_id before storage (FK fix)
        {sessionDbId=2, newId=f68e338f-cf2b-49b3-b0d9-4aebda655a33}
[INFO ] [SESSION] [session-2] MEMORY_ID_CAPTURED
[INFO ] [SYSTEM] Worker available
```

✅ 子程序不再 exit code 1
✅ Memory session ID 正常捕獲
✅ Worker 進入可用狀態
✅ MCP endpoint 可正常回應

---

## 五、根本原因 (Root Cause) 總結

| 層級 | 原因 |
|------|------|
| **表象** | `Claude Code process exited with code 1` |
| **直接原因** | claude CLI 收到 `--setting-sources ""` 吃掉下個參數 |
| **中層原因** | `worker-service.cjs` 傳遞空字串而非省略該 flag |
| **根本原因** | `[] && push(...)` 條件未檢查陣列長度（GitHub Issue #2049） |
| **觸發條件** | 用戶未在 claude-mem 設定任何 `settingSources`，預設為空陣列 |

---

## 六、教訓與後續建議

### 教訓
1. **Plugin 快取路徑陷阱** — `.claude/plugins/` 下有 `marketplaces/` 和 `cache/` 兩份副本，修補 bug 時必須全部同步。
2. **Truthy 陷阱** — JavaScript 空陣列 `[]` 是 truthy，在組命令列參數時務必加 `.length > 0`。
3. **Windows 埠號回收慢** — 重度 debug 時建議直接換新埠，比等待 TIME_WAIT 清理快。
4. **DEBUG log 是寶藏** — 前三個假設都錯，只有打開 DEBUG 看 stderr 才抓到真凶。

### 建議 upstream 動作
- 向 thedotmack 提交 PR 修復 `worker-service.cjs`（也可直接升級 `@anthropic-ai/claude-agent-sdk` 至修好 #2049 的版本）
- 在 claude-mem README 加註此已知問題與 workaround

---

## 七、修改檔案清單 (Changed Files)

| 檔案 | 操作 | 說明 |
|------|------|------|
| `C:\Users\john\.claude-mem\settings.json` | 修改 | 設定 `CLAUDE_CODE_PATH`、`CLAUDE_MEM_WORKER_PORT=38000`、`CLAUDE_MEM_LOG_LEVEL=DEBUG` |
| `...\plugins\marketplaces\thedotmack\plugin\scripts\worker-service.cjs` | Patch | 加 `S.length>0` 守衛 |
| `...\plugins\cache\thedotmack\claude-mem\12.1.5\scripts\worker-service.cjs` | Patch | 加 `S.length>0` 守衛（**實際被載入的那份**） |

---

**修復狀態**: 🟢 已完成並驗證
**後續追蹤**: 等 claude-mem v12.1.6+ 釋出後可移除 patch，直接升級官方版本
