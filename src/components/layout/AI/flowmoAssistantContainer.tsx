import { Card } from "@/components/ui/card";
import { useAiEvents } from "@/hooks/use-ai-events";
import {
  chatAi,
  getCurrentUserId,
  listAiTools,
  type ToolDefinition,
} from "@/lib/backend-api";
import { FormEvent, useEffect, useMemo, useState } from "react";

type FlowmoAssistantContainerProps = {
  aiState: "expanded" | "collapsed";
  toggleAI: () => void;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const FlowmoAssistantContainer: React.FC<FlowmoAssistantContainerProps> = ({
  aiState,
  toggleAI,
}) => {
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Connected to ai-orchestration chat mode. Send plain English requests (example: create this task title is yow_testRabbi and description is yesy yesyyese).",
    },
  ]);
  const [tools, setTools] = useState<ToolDefinition[]>([]);
  const [isSending, setIsSending] = useState(false);

  const { events, isConnected } = useAiEvents();

  useEffect(() => {
    listAiTools()
      .then(setTools)
      .catch((error: Error) => {
        setMessages((prev) => [
          ...prev,
          {
            id: `tools-error-${Date.now()}`,
            role: "assistant",
            content: `Failed to load tools: ${error.message}`,
          },
        ]);
      });
  }, []);

  const toolsPreview = useMemo(() => {
    return tools
      .slice(0, 8)
      .map((tool) => tool.name)
      .join(", ");
  }, [tools]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const raw = inputText.trim();
    if (!raw) {
      return;
    }

    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: "user", content: raw },
    ]);
    setInputText("");
    setIsSending(true);

    try {
      const currentUserId = getCurrentUserId();
      if (!currentUserId) {
        throw new Error(
          "No signed-in user id found. Please sign up or log in again.",
        );
      }
      const result = await chatAi(raw, { userId: currentUserId });
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: `${result.message}\n\nStatus: ${result.status}\nPlanned: ${JSON.stringify(
            result.plannedActions,
            null,
            2,
          )}\nResults: ${JSON.stringify(result.results, null, 2)}`,
        },
      ]);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to execute AI chat orchestration.";

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content: `Execution error: ${message}`,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card
      className={`fixed top-0 right-0 p-0 rounded-none ${
        aiState !== "expanded" ? "w-20" : "w-100"
      } h-full z-40 bg-white border shadow-sm flex flex-col transition-all duration-200`}
    >
      <div
        className={`flex z-40 justify-between mt-2 items-center w-full h-13 border-b pl-4 pr-2`}
      >
        {aiState !== "expanded" ? null : (
          <span className="text-sm p-1 ml-2 px-5 rounded-full text-white font-semibold border-b bg-linear-to-r from-blue-600 to-purple-600">
            AI Assistant {isConnected ? "(WS On)" : "(WS Off)"}
          </span>
        )}
        <div className="flex items-center gap-2">
          <button type="button" onClick={toggleAI}>
            <img
              src="/src/assets/loading.gif"
              alt="AI Assistant"
              className="h-10 mr-2 cursor-pointer"
            />
          </button>
        </div>
      </div>

      {aiState !== "expanded" ? null : (
        <>
          <div className="px-4 py-2 text-xs text-gray-600 border-b bg-gray-50">
            {tools.length > 0 ? `Tools: ${toolsPreview}` : "Loading tools..."}
          </div>

          <div className="flex-1 m-2 rounded-sm text-sm overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={
                  message.role === "user"
                    ? "flex justify-end"
                    : "flex justify-start"
                }
              >
                <pre
                  className={
                    message.role === "user"
                      ? "bg-indigo-500 text-white px-4 py-2 rounded-lg max-w-xs whitespace-pre-wrap"
                      : "bg-gray-200 text-gray-900 px-4 py-2 rounded-lg max-w-xs whitespace-pre-wrap"
                  }
                >
                  {message.content}
                </pre>
              </div>
            ))}

            {events.length > 0 && (
              <div className="rounded border p-2 bg-white text-xs">
                <p className="font-semibold mb-2">Live Orchestration Events</p>
                <div className="space-y-1">
                  {events.slice(0, 3).map((event, index) => (
                    <p key={`${event.type}-${index}`}>
                      [{event.type}] {event.requestId ?? "no-request-id"}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex items-center border-t p-2 bg-white"
          >
            <input
              type="text"
              placeholder="Example: create this task title will be yow_testRabbi and description is yesy yesyyese"
              className="flex-1 border rounded-full px-4 py-2 mr-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={inputText}
              onChange={(event) => setInputText(event.target.value)}
            />
            <button
              type="submit"
              disabled={isSending}
              className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 disabled:opacity-60"
            >
              {isSending ? "..." : "Send"}
            </button>
          </form>
        </>
      )}
    </Card>
  );
};

export default FlowmoAssistantContainer;
