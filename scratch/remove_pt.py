import re
import os

filepath = r"e:\ff\frr\src\pages\dashboard\FounderGPT.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. State variables and constants
content = re.sub(r"const PIRANHA_PLACEHOLDERS = \[\s*\"[^\"]+\",\s*\"[^\"]+\"\s*\];", "", content)
content = re.sub(r"const \[ptMessages, setPtMessages\] = useState<ChatMessage\[\]>\(\[\]\)\n", "", content)
content = re.sub(r"const \[activeMode, setActiveMode\] = useState<'foundergpt' \| 'piranhatank'>\('foundergpt'\)\n", "", content)
content = re.sub(r"const \[ptTab, setPtTab\] = useState<'home' \| 'pitches' \| 'ranks' \| 'sharks' \| 'profile' \| 'choose_sharks' \| 'chat'>\('home'\)\n", "", content)
content = re.sub(r"const \[selectedSharks, setSelectedSharks\] = useState<string\[\]>\(\[\]\)\n", "", content)

# 2. Mode-aware aliases
content = re.sub(r"const isPiranha = activeMode === 'piranhatank';\n\s*const messages = isPiranha \? ptMessages : gptMessages;\n\s*const setMessages = isPiranha \? setPtMessages : setGptMessages;\n", "const messages = gptMessages;\n    const setMessages = setGptMessages;\n", content)

# 3. Rotating Piranha Placeholder logic
content = re.sub(r"// Rotating Piranha Placeholder logic\n\s*const \[piranhaPlaceholder, setPiranhaPlaceholder\] = useState\(PIRANHA_PLACEHOLDERS\[0\]\);\n\n\s*useEffect\(\(\) => \{\n\s*const lastIndex = parseInt\(localStorage\.getItem\('piranha_placeholder_index'\) \|\| '-1'\);\n\s*const nextIndex = \(lastIndex \+ 1\) % PIRANHA_PLACEHOLDERS\.length;\n\s*localStorage\.setItem\('piranha_placeholder_index', nextIndex\.toString\(\)\);\n\s*setPiranhaPlaceholder\(PIRANHA_PLACEHOLDERS\[nextIndex\]\);\n\n", "    useEffect(() => {\n", content)

# 4. Theme Orchestration
theme_replacement = """    const theme = {
        bg: "bg-[#000000]",
        text: "text-white",
        textMuted: "text-gray-400",
        headerBg: "bg-black/80",
        card: "bg-[#0a0a0a] border-white/10",
        input: "bg-[#0a0a0a] border-white/10 focus-within:border-white",
        aiBubble: "bg-[#111] border border-white/5 text-gray-300",
        userBubble: "bg-white text-black",
        accent: "bg-white",
        accentText: "text-white",
        sidebarBg: "bg-[#000000]",
        sidebarText: "text-white",
        sidebarBorder: "border-white/10"
    };"""
content = re.sub(r"const theme = \{[^\}]+\};", theme_replacement, content)

# 5. ribbonItems and ptSharks
content = re.sub(r"const ribbonItems = \[\s*\{[^\}]+\},\s*\{[^\}]+\},\s*\{[^\}]+\},\s*\{[^\}]+\},\s*\{[^\}]+\},\s*\];\n\n\s*const ptSharks = \[\s*\{[^\}]+\},\s*\{[^\}]+\},\s*\{[^\}]+\},\s*\];", "", content)

# 6. piranhaSessions
content = re.sub(r"const piranhaSessions = sessions\.filter\(s =>\s*s\.personality_id === 'Piranha Panel' \|\| ptSharks\.some\(shark => shark\.name === s\.personality_id\)\s*\);", "", content)

# 7. handleSendMessage activeMentor logic
mentor_logic_replace = """        if (isPiranha) {
            if (selectedSharks.length === 1) {
                activeMentor = ptSharks.find(s => s.id === selectedSharks[0])?.name || "Piranha Panel";
            } else {
                activeMentor = "Piranha Panel";
            }
        }"""
content = content.replace(mentor_logic_replace, "")

content = content.replace("if (!isPiranha) {\n                const bestMentor", "const bestMentor")
content = content.replace("setPersonality(bestMentor);\n                }\n            }", "setPersonality(bestMentor);\n            }")

content = content.replace("if (isPiranha && ptTab === 'home') setPtTab('home') // maintain if home, else if chat it stays", "")

# 8. handleNewChat logic
handle_new_chat_replace = """    const handleNewChat = () => {
        if (isPiranha) {
            setPtMessages([])
            setQuery("")
            setIsSidebarOpen(false)
            if (ptTab === 'chat') setPtTab('home')
        } else {
            setCurrentSessionId(null)
            setGptMessages([])
            setQuery("")
            setIsSidebarOpen(false)
            setHasManuallySelectedMentor(false)
            sessionStorage.removeItem('foundergpt_messages');
            sessionStorage.removeItem('foundergpt_sessionId');
            sessionStorage.removeItem('foundergpt_personality');
        }
    }"""
handle_new_chat_new = """    const handleNewChat = () => {
        setCurrentSessionId(null)
        setGptMessages([])
        setQuery("")
        setIsSidebarOpen(false)
        setHasManuallySelectedMentor(false)
        sessionStorage.removeItem('foundergpt_messages');
        sessionStorage.removeItem('foundergpt_sessionId');
        sessionStorage.removeItem('foundergpt_personality');
    }"""
content = content.replace(handle_new_chat_replace, handle_new_chat_new)

# 9. displayedSessions
content = content.replace("const displayedSessions = isPiranha ? [] : sessions;", "const displayedSessions = sessions;")

# 10. Sidebar header icon
content = content.replace('className={cn("h-8 w-8 rounded-xl flex items-center justify-center", isPiranha ? "bg-[#DC143C]" : "bg-black")}', 'className="h-8 w-8 rounded-xl flex items-center justify-center bg-black"')

# 11. Remove {!isPiranha && ( ... )} wrapper around Personality Selector
content = content.replace("{!isPiranha && (\n                                <div className=\"mb-6 space-y-2 relative\">", "<div className=\"mb-6 space-y-2 relative\">")
# Remove the closing brace for that wrapper
content = re.sub(r"(\s*</AnimatePresence>\n\s*</div>)\n\s*\)", r"\1", content, count=1)

# 12. New Chat Button
content = content.replace('isPiranha \n                                        ? "bg-[#1A1A1A] border border-red-900/30 hover:bg-[#222] text-white" \n                                        : "bg-[#111] border border-white/10 hover:bg-white/5 text-white"', '"bg-[#111] border border-white/10 hover:bg-white/5 text-white"')
content = content.replace('<Plus className={cn("h-4 w-4", isPiranha ? "text-[#FF0000]" : "text-black")} />', '<Plus className="h-4 w-4 text-white" />')

# 13. Sidebar trigger
content = content.replace('isPiranha ? "bg-[#111] border-red-900/40 text-red-500" : "bg-black/80 border-white/10 text-white"', '"bg-black/80 border-white/10 text-white"')

# 14. Mode Switcher
mode_switcher_regex = r"\{\/\* Separated Mode Switcher - Fixed Top Right \*\/\}[\s\S]*?(?=\{\/\* Floating Promo Message \*\/\}|\{\/\* Piranha Tank Vertical)"
content = re.sub(mode_switcher_regex, "", content)

# 15. Piranha Tank Vertical Left Ribbon
ribbon_regex = r"\{\/\* Piranha Tank Vertical Left Ribbon \(Desktop Only\) \*\/\}[\s\S]*?(?=\{\/\* Main Content \*\/\}|\{\/\* Main Content)"
content = re.sub(ribbon_regex, "", content)

# 16. Main content wrapper
content = content.replace("isPiranha && \"md:ml-24\"\n            )}>", ")}>\n")

# 17. Huge Piranha Tank block
# From "{/* Piranha Tank Desktop Navigation Bar REMOVED FROM HERE */}" down to "} : !hasMessages && !(isPiranha && ptTab === 'chat') ? ("
# Wait, this is very tricky to regex safely. I will use string slicing.
start_str = "{/* Mobile Bottom Navigation Bar for Piranha Tank */}"
end_str = ") : !hasMessages && !(isPiranha && ptTab === 'chat') ? ("
if start_str in content and end_str in content:
    start_idx = content.find(start_str)
    end_idx = content.find(end_str) + len(end_str)
    content = content[:start_idx] + "\n                {!hasMessages ? (\n" + content[end_idx:]

# 18. Welcome Screen changes
content = content.replace('isPiranha \n                                            ? "bg-[#FF0000] shadow-red-900/40" \n                                            : "bg-white shadow-[0_0_60px_rgba(255,255,255,0.4),0_20px_40px_rgba(0,0,0,0.4)] hover:shadow-[0_0_80px_rgba(255,255,255,0.6)] scale-105"', '"bg-white shadow-[0_0_60px_rgba(255,255,255,0.4),0_20px_40px_rgba(0,0,0,0.4)] hover:shadow-[0_0_80px_rgba(255,255,255,0.6)] scale-105"')
content = content.replace('{isPiranha ? (\n                                        <img \n                                            src={`${import.meta.env.BASE_URL}logo.jpg`} \n                                            alt="Kasb.AI Logo" \n                                            className="h-full w-full object-cover mix-blend-multiply brightness-75 contrast-125" \n                                        />\n                                    ) : (\n                                        <img \n                                            src={`${import.meta.env.BASE_URL}logo.jpg`} \n                                            alt="Kasb.AI Logo" \n                                            className="h-full w-full object-contain" \n                                        />\n                                    )}', '<img \n                                            src={`${import.meta.env.BASE_URL}logo.jpg`} \n                                            alt="Kasb.AI Logo" \n                                            className="h-full w-full object-contain" \n                                        />')

content = content.replace('isContextLoaded && startupContext && !isPiranha && (', 'isContextLoaded && startupContext && (')

content = content.replace('isPiranha ? "bg-[#FF0000]/30" : "bg-white/20"', '"bg-white/20"')
content = content.replace('!isPiranha && "group-focus-within:shadow-[0_0_50px_rgba(255,255,255,0.2)] group-focus-within:border-white/40",\n                                        isPiranha && harshMode && "border-red-900/50 shadow-red-900/40"', '"group-focus-within:shadow-[0_0_50px_rgba(255,255,255,0.2)] group-focus-within:border-white/40"')

content = content.replace('placeholder={isPiranha ? piranhaPlaceholder : "Describe your startup idea..."}', 'placeholder="Describe your startup idea..."')

content = content.replace('isListening ? "text-red-500 bg-red-500/20 animate-pulse shadow-[0_0_15px_rgba(255,0,0,0.5)]" : isPiranha ? "text-gray-500 hover:text-white" : "text-gray-400 hover:text-black"', 'isListening ? "text-red-500 bg-red-500/20 animate-pulse shadow-[0_0_15px_rgba(255,0,0,0.5)]" : "text-gray-400 hover:text-black"')

content = content.replace('query.trim() ? cn("text-white scale-100 shadow-lg", isPiranha ? "bg-[#FF0000] hover:bg-[#B22222]" : "bg-black hover:bg-gray-800") : cn("scale-90", isPiranha ? "bg-white/5 text-gray-600" : "bg-gray-50 text-gray-300")', 'query.trim() ? cn("text-white scale-100 shadow-lg", "bg-black hover:bg-gray-800") : cn("scale-90", "bg-gray-50 text-gray-300")')

# Advanced Toggles Row
adv_toggles_start = "{!isPiranha ? ("
adv_toggles_end = ")}</div>"
# Quick replace the condition
content = content.replace("{!isPiranha ? (", "")

# We need to remove the harsh mode part
harsh_mode_regex = r"\) : \([\s\S]*?Interrupt \{\w+\? \"ON\" : \"OFF\"\}\n\s*</button>\n\s*</>\n\s*\)"
content = re.sub(harsh_mode_regex, "", content)

content = content.replace('p className={cn("text-[10px] font-bold uppercase tracking-[0.2em] mt-8 text-center", isPiranha ? "text-red-900/40" : "text-gray-300")}', 'p className="text-[10px] font-bold uppercase tracking-[0.2em] mt-8 text-center text-gray-300"')
content = content.replace('p className={cn("text-center text-[10px] font-bold uppercase tracking-[0.2em] mt-3", isPiranha ? "text-red-900/40" : "text-gray-300")}', 'p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] mt-3 text-gray-300"')
content = content.replace('p className={cn("text-center text-[9px] font-bold uppercase tracking-[0.2em] mt-3", isPiranha ? "text-red-900/40" : "text-gray-300")}', 'p className="text-center text-[9px] font-bold uppercase tracking-[0.2em] mt-3 text-gray-300"')


content = content.replace('{!isPiranha && (\n                                        <div className="flex flex-wrap justify-center gap-2 mt-4">', '<div className="flex flex-wrap justify-center gap-2 mt-4">')
content = re.sub(r'(<div className="flex flex-wrap justify-center gap-2 mt-4">[\s\S]*?</div>)\n\s*\)', r'\1', content, count=1)

# Chat view replacements
content = content.replace('const mentorIcon = isPiranha ? "🐟" : (personalities.find(p => p.id === msg.mentorId)?.icon || "🤖");', 'const mentorIcon = personalities.find(p => p.id === msg.mentorId)?.icon || "🤖";')
content = content.replace('const alternativeMentors = isPiranha ? [] : (msg.originalPrompt', 'const alternativeMentors = msg.originalPrompt')
content = content.replace("filter(m => m !== msg.mentorId)\n                                        : []);", "filter(m => m !== msg.mentorId)\n                                        : [];")

content = content.replace('className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-1", isPiranha ? "bg-[#DC143C]" : "bg-black")}', 'className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-1 bg-black"')
content = content.replace('msg.role === "assistant" && (isPiranha || msg.mentorId) && (', 'msg.role === "assistant" && msg.mentorId && (')
content = content.replace('{isPiranha ? `🐟 ${selectedSharks.length > 1 ? \'Piranha Panel\' : (ptSharks.find(s => s.id === selectedSharks[0])?.name || \'Piranha\')}` : `${mentorIcon} ${msg.mentorId}`}', '{`${mentorIcon} ${msg.mentorId}`}')

content = content.replace('className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-1", isPiranha ? "bg-[#8B0000]" : "bg-white")}', 'className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-1 bg-white"')
content = content.replace('<User className={cn("h-4 w-4", isPiranha ? "text-white" : "text-black")} />', '<User className="h-4 w-4 text-black" />')

content = content.replace('className={cn("rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2", isPiranha ? "bg-[#161616] border border-red-900/20" : "bg-gray-50 border border-gray-100")}', 'className="rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2 bg-gray-50 border border-gray-100"')
content = content.replace('<Loader2 className={cn("h-4 w-4 animate-spin", isPiranha ? "text-gray-500" : "text-gray-400")} />', '<Loader2 className="h-4 w-4 animate-spin text-gray-400" />')
content = content.replace('<span className={cn("text-sm font-medium", isPiranha ? "text-gray-400" : "text-gray-400")}>', '<span className="text-sm font-medium text-gray-400">')
content = content.replace('{isPiranha ? "The Piranhas are thinking..." : `${personality} is thinking...`}', '{`${personality} is thinking...`}')

content = content.replace('placeholder={isPiranha ? piranhaPlaceholder : "Ask a follow-up..."}', 'placeholder="Ask a follow-up..."')
content = content.replace('query.trim() && !isLoading ? cn("text-white scale-100 shadow-lg", isPiranha ? "bg-[#DC143C] hover:bg-[#B22222]" : "bg-black hover:bg-gray-800") : cn("scale-90", isPiranha ? "bg-white/5 text-gray-600" : "bg-gray-50 text-gray-300")', 'query.trim() && !isLoading ? cn("text-white scale-100 shadow-lg", "bg-black hover:bg-gray-800") : cn("scale-90", "bg-gray-50 text-gray-300")')

content = content.replace('className={cn("fixed bottom-28 right-6 h-12 w-12 rounded-full shadow-2xl flex items-center justify-center transition-all z-[999] border backdrop-blur-md", isPiranha ? "bg-[#DC143C]/90 text-white border-white/10 hover:bg-[#DC143C]" : "bg-black/90 text-white border-white/20 hover:bg-black")}', 'className="fixed bottom-28 right-6 h-12 w-12 rounded-full shadow-2xl flex items-center justify-center transition-all z-[999] border backdrop-blur-md bg-black/90 text-white border-white/20 hover:bg-black"')

# Extra check for harsh mode in bottom input row
content = content.replace("{!isPiranha ? (", "")
content = re.sub(harsh_mode_regex, "", content)

# Remove the unused icon imports if any
content = content.replace(", Fish, ", ", ")
content = content.replace(", Skull", "")

# Remove `import { buildStartupContextBlock } from "../../lib/startupContext"` if that was mistakenly tied, but it's not.
# Remove unused state variables that might be imported
content = content.replace("const [allowInterruption, setAllowInterruption] = useState(false)\n", "")
content = content.replace("const [harshMode, setHarshMode] = useState(false)\n", "")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Done replacing.")
