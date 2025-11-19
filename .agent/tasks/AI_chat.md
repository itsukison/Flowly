Refactor AI Chat into Floating Widget with Agent Mode
Overview
I will replace the existing "AI Chat" button and modal with a floating widget (bottom-right). This widget will feature a "Chat Mode" for filtering/Q&A and an "Agent Mode" for data generation/enrichment (Gemini 3 Pro), including the logic from AI_DATA_GENERATION_GEMINI_3_REFACTOR.md.

Implementation Details
1. Create AIChatWidget.tsx
  Location: Flowly/components/tables/widgets/AIChatWidget.tsx
  UI:
  Floating Action Button (FAB) with logo_white.png.
  Popover window (5:6 ratio).
  Tabs for "Chat" and "Agent".
  IME-aware input handling (fixes Japanese input bug).
  Chat Mode:
  Connects to /api/chat/query.
  Parses query_records function calls to apply filters directly to the DiceTableView instead of showing a mini-table.
  Agent Mode:
  Implements the "Data Generation" workflow (similar to AIEnrichmentModal).
  Parses natural language to extract requirements (row count, description, etc.).
  Triggers Gemini3Service for generation/enrichment.
  Displays real-time progress (logs, progress bar, live table preview) within the widget.
2. Modify DiceTableView.tsx
  Remove the old "AI Chat" button from the toolbar.
  Remove AIChatModal.
  Integrate AIChatWidget.
  Pass callback functions (setColumnFilters, handleAddRow, handleAddColumn) to the widget.
3. Update Backend (geminiChat.ts)
  Update processAIQuery to return functionArgs in the response so the frontend can access filter parameters.
Implementation Todos
[ ] Create AIChatWidget.tsx with FAB and Chat/Agent tabs
[ ] Implement Chat Mode logic (Apply filters to main table)
[ ] Implement Agent Mode logic (Data Generation/Enrichment flow)
[ ] Modify geminiChat.ts to expose functionArgs
[ ] Update DiceTableView.tsx to replace AIChatModal with AIChatWidget
[ ] Verify IME input handling
