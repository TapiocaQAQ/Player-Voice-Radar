# Skills

- **git-commit** (`.claude/skills/git-commit/SKILL.md`) - Conventional Commits 格式化 git commit。Trigger: `/commit`
  When the user asks to commit changes, create a git commit, or types `/commit`, invoke the Skill tool with `skill: "git-commit"` before doing anything else.

- **graphify** (`.claude/skills/graphify/SKILL.md`) - any input to knowledge graph. Trigger: `/graphify`
  When the user types `/graphify`, invoke the Skill tool with `skill: "graphify"` before doing anything else.

- **skills-security-check** (`.claude/skills/skills-security-check/SKILL.md`) - Detect Skill vulnerabilities using static and AI checks. Trigger: `/skills-security-check`
  When the user requests scanning or auditing skills, invoke the Skill tool with `skill: "skills-security-check"` before doing anything else.

- **find-skills** (`.claude/skills/find-skills/SKILL.md`) - Helps users discover and install agent skills. Trigger: `/find-skills`
  When the user asks "find a skill for X", "is there a skill that can...", or wants to extend capabilities, invoke the Skill tool with `skill: "find-skills"` before doing anything else.

- **agent-browser** (`.claude/skills/agent-browser/SKILL.md`) - Browser automation CLI. Trigger: `/agent-browser`
  When the user needs to interact with websites, fill forms, click buttons, take screenshots, scrape data, or automate any browser task, invoke the Skill tool with `skill: "agent-browser"` before doing anything else.

- **agentcore** (`.claude/skills/agentcore/SKILL.md`) - Run agent-browser on AWS Bedrock AgentCore cloud browsers. Trigger: `/agentcore`

- **dogfood** (`.claude/skills/dogfood/SKILL.md`) - QA/exploratory testing of web apps. Trigger: `/dogfood`
  When the user asks to "dogfood", "QA", "find bugs", or "test this app", invoke the Skill tool with `skill: "dogfood"` before doing anything else.

- **electron** (`.claude/skills/electron/SKILL.md`) - Automate Electron desktop apps via Chrome DevTools Protocol. Trigger: `/electron`

- **slack** (`.claude/skills/slack/SKILL.md`) - Interact with Slack via browser automation. Trigger: `/slack`

- **vercel-sandbox** (`.claude/skills/vercel-sandbox/SKILL.md`) - Run agent-browser + Chrome inside Vercel Sandbox microVMs. Trigger: `/vercel-sandbox`

- **browser-use** (`.claude/skills/browser-use/SKILL.md`) - AI-powered browser automation using browser-use Python library. Trigger: `/browser-use`

- **cloud** (`.claude/skills/cloud/SKILL.md`) - browser-use cloud managed browser sessions. Trigger: `/cloud`

- **open-source** (`.claude/skills/open-source/SKILL.md`) - browser-use open-source self-hosted browser automation. Trigger: `/open-source`

- **remote-browser** (`.claude/skills/remote-browser/SKILL.md`) - Connect browser-use to remote browser instances. Trigger: `/remote-browser`

# File & Output Storage Guidelines

When executing any task, you must strictly adhere to the following two default behaviors. It is absolutely prohibited to scatter files in the root directory or any unspecified folders:

1. **Screenshots**
   Whenever you perform a screenshot action (e.g., capturing the screen using agent-browser), you must save the screenshot files directly into `./screenshot`.

2. **Reports**
   Whenever you generate any form of summary, analysis, or audit report, you must default to using the Markdown format (with a `.md` extension) and save the report file directly into `./gitversion`.



# Strict Rules for Python Virtual Environment (Conda Environment Rules)

In this project, all Python code execution and package management must be strictly confined to the Conda virtual environment named `PlayerVoiceRadar`.

As an AI assistant, when you need to execute Python scripts or install packages, **you are strictly prohibited from using the global `python` or `pip` commands.**

Please strictly adhere to the following command formats:

1. **Executing Python Scripts**:
   -  Correct: `conda run -n PlayerVoiceRadar python main.py`

2. **Installing Python Packages**:
   -  Correct: `conda run -n PlayerVoiceRadar pip install requests` 
   - (Or: `conda install -n PlayerVoiceRadar <package_name>`)

3. **Checking Packages or Versions**:
   -  Correct: `conda run -n PlayerVoiceRadar pip list`

Any operation involving the Python environment must be prefixed with `conda run -n PlayerVoiceRadar`. If you discover that this environment does not exist, please notify me first. Do not attempt to create it automatically or fall back to the global environment.


# ⚠️ Supreme Security Guidelines: Skill Quarantine Workflow

As my dedicated AI assistant, whenever I request you to download, install, or reference any Skill from `skills.sh`, GitHub, or any external source, **you must strictly adhere to the following 4 steps. Skipping or making independent decisions is absolutely prohibited.**

1. **Mandatory Quarantine**:
   - It is strictly forbidden to download or extract unknown Skills directly into the project's `.claude/skills/` or the global `~/.claude/skills/` directories.
   - You must first create a temporary folder in the system's `/tmp/quarantine-skills/` (or `%TEMP%\quarantine-skills\` on Windows) and download the target Skill there.

2. **Automated Audit**:
   - Immediately after downloading, invoke the installed `skills-security-check` tool (or its corresponding terminal command) to perform a deep scan on the Skill currently in the quarantine zone.

3. **Report & Halt**:
   - Once the scan is complete, suspend all actions.
   - Output a concise "Security Audit Report" to me in the chat, which must include:
     * Target Skill name and source.
     * Any detected network connection requests, suspicious commands (e.g., `exec`, `os.system`), or high-risk logic.
     * The final verdict from `skills-security-check` (Safe / Warning / Critical).

4. **Manual Override**:
   - Wait for my explicit response.
   - Only after I input "approve", "safe", or `y` are you permitted to move the Skill from the quarantine zone to the official `.claude/skills/` directory and formally activate it.
   - If I refuse, immediately delete the file from the quarantine zone.