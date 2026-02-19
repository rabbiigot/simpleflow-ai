import { Card } from "@/components/ui/card";

type FlowmoAssistantContainerProps = {
  aiState: "expanded" | "collapsed";
  toggleAI: () => void;
};

const FlowmoAssistantContainer: React.FC<FlowmoAssistantContainerProps> = ({
  aiState,
  toggleAI,
}) => {
  return (
    <Card
      className={`fixed top-0 right-0 p-0 rounded-none ${
        aiState !== "expanded" ? "w-20" : "w-100"
      } h-full z-40 bg-white border shadow-sm flex flex-col transition-all duration-200  `}
    >
      {/* Header */}
      <div
        className={`flex z-40 justify-between mt-2 items-center w-full h-13 border-b ${
          aiState !== "expanded" ? "" : "p-0"
        } cursor-pointer pl-4`}
        onClick={toggleAI}
      >
        {aiState !== "expanded" ? null : (
          <>
            <span className="text-sm p-1 ml-2 px-5 rounded-full text-white font-semibold border-b bg-linear-to-r from-blue-600 to-purple-600">
              AI Assistant
            </span>
          </>
        )}
        <img
          src="/src/assets/loading.gif"
          alt="AI Assistant"
          className="h-10 mr-5 cursor-pointer"
        />
      </div>
      {aiState !== "expanded" ? null : (
        <>
          <div className="flex-1 m-2 rounded-sm text-sm overflow-y-auto p-4 space-y-4 bg-gray-50">
            {/* User message */}
            <div className="flex justify-end">
              <div className="bg-indigo-500 text-white px-4 py-2 rounded-lg max-w-xs">
                Hello, AI!
              </div>
            </div>

            {/* AI message */}
            <div className="flex justify-start">
              <div className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg max-w-xs">
                Hi there! How can I assist you today?
              </div>
            </div>

            {/* Another user message */}
            <div className="flex justify-end">
              <div className="bg-indigo-500 text-white px-4 py-2 rounded-lg max-w-xs">
                Can you give me a mock response?
              </div>
            </div>

            {/* Another AI message */}
            <div className="flex justify-start">
              <div className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg max-w-xs">
                Sure! This is a mock conversation to show how it will look.
              </div>
            </div>
          </div>

          {/* Input area */}
          <div className="flex items-center border-t p-2 bg-white">
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 border rounded-full px-4 py-2 mr-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700">
              Send
            </button>
          </div>
        </>
      )}
      {/* Chat area */}
    </Card>
  );
};

export default FlowmoAssistantContainer;
