import { NextRequest, NextResponse } from "next/server";
import { Message as VercelChatMessage, StreamingTextResponse } from "ai";

import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import { Calculator } from "@langchain/community/tools/calculator";
import {
  AIMessage,
  BaseMessage,
  ChatMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";

// Cache to store the holdings data
let cachedHoldingsData: any = null;
let cacheTimestamp: number | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

export const runtime = "edge";

// fetch holdings data from the API
async function fetchHoldingsData() {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_FLASK_API_URL}/holdings`,
    {
      method: "GET",
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch data: ${response.statusText}`);
  }

  return response.json();
}

// Function to initialize cache
async function initializeCache() {
  try {
    cachedHoldingsData = await fetchHoldingsData();
    cacheTimestamp = Date.now();
  } catch (error) {
    console.error("Failed to initialize cache:", error);
  }
}

// Initialize cache when the module is loaded
initializeCache();

const convertVercelMessageToLangChainMessage = (message: VercelChatMessage) => {
  if (message.role === "user") {
    return new HumanMessage(message.content);
  } else if (message.role === "assistant") {
    return new AIMessage(message.content);
  } else {
    return new ChatMessage(message.content, message.role);
  }
};

const convertLangChainMessageToVercelMessage = (message: BaseMessage) => {
  if (message._getType() === "human") {
    return { content: message.content, role: "user" };
  } else if (message._getType() === "ai") {
    return {
      content: message.content,
      role: "assistant",
      tool_calls: (message as AIMessage).tool_calls,
    };
  } else {
    return { content: message.content, role: message._getType() };
  }
};

// Function to generate the AGENT_SYSTEM_TEMPLATE with data
const generateAgentSystemTemplate = (holdingsData: any) => `
Your name is Warren.
You are a portfolio assistant that provides insights about the portfolio data provided.
You answer succinctly and accurately based on the information you are given.
You may use the tools available to you to answer if necessary.
If you don't know the answer you simply say you don't know.
Current conversation:
{chat_history}

User: {input}
AI:

Current portfolio holdings:
${JSON.stringify(holdingsData)}
`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const returnIntermediateSteps = body.show_intermediate_steps;
    const messages = (body.messages ?? [])
      .filter(
        (message: VercelChatMessage) =>
          message.role === "user" || message.role === "assistant",
      )
      .map(convertVercelMessageToLangChainMessage);

    // Check if cache is still valid
    if (
      !cachedHoldingsData ||
      Date.now() - (cacheTimestamp || 0) > CACHE_TTL_MS
    ) {
      // Cache is invalid or not initialized, re-fetch data
      await initializeCache();
    }

    // Use cached data
    const holdingsData = cachedHoldingsData;

    const tools = [new Calculator()];
    const chat = new ChatOpenAI({
      model: "gpt-4o-mini",
      temperature: 0,
    });

    // Generate the agent system template with the cached holdings data
    const agentSystemTemplate = generateAgentSystemTemplate(holdingsData);

    const agent = createReactAgent({
      llm: chat,
      tools,
      messageModifier: new SystemMessage(agentSystemTemplate),
    });

    if (!returnIntermediateSteps) {
      const eventStream = await agent.streamEvents(
        { messages },
        { version: "v2" },
      );

      const textEncoder = new TextEncoder();
      const transformStream = new ReadableStream({
        async start(controller) {
          for await (const { event, data } of eventStream) {
            if (event === "on_chat_model_stream") {
              if (!!data.chunk.content) {
                controller.enqueue(textEncoder.encode(data.chunk.content));
              }
            }
          }
          controller.close();
        },
      });

      return new StreamingTextResponse(transformStream);
    } else {
      const result = await agent.invoke({ messages });
      return NextResponse.json(
        {
          messages: result.messages.map(convertLangChainMessageToVercelMessage),
        },
        { status: 200 },
      );
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}
