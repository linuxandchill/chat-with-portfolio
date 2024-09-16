import { ChatWindow } from "@/components/ChatWindow";

export default function AgentsPage() {
  const InfoCard = (
    <div className="p-4 md:p-8 rounded bg-[#25252d] w-full max-h-[85%] overflow-hidden">
      <h1 className="text-3xl md:text-4xl mb-4">Warren: Portfolio Assistant</h1>
      <ul>
        <li className="text-l">
          💻
          <span className="ml-2">
            This chatbot retrieves your holdings and answers questions about
            your portfolio.
          </span>
        </li>
        <li>
          🛠️
          <span className="ml-2">The bot has access to a calculator.</span>
        </li>
        <li className="text-l">
          📈
          <span className="ml-2">
            You may ask things like{" "}
            <code>how many shares of UBER do i have?</code> Try it!
          </span>
        </li>
      </ul>
    </div>
  );
  return (
    <ChatWindow
      endpoint="api/chat/agents"
      emoji="🤖"
      emptyStateComponent={InfoCard}
      titleText="Warren the portfolio assistant."
      placeholder="Ask me something about your portfolio"
      showIntermediateStepsToggle={true}
    ></ChatWindow>
  );
}
