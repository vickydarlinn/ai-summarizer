import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { CheerioWebBaseLoader } from "langchain/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const port = 3500;

const app = express();
app.use(cors());
app.use(express.json());
app.post("/summarize", async (req, res) => {
  try {
    const url = req.body.url;

    const result = await fetchInfo(url);
    res.status(200).json({ result });
  } catch (error) {
    res.status(400).json(error);
    console.log(error);
  }
});
async function fetchInfo(
  webPageLink,
  userQuestion = "give me summary of this page article properly"
) {
  const chatModel = new ChatOpenAI();
  const loader = new CheerioWebBaseLoader(webPageLink);
  const splitter = new RecursiveCharacterTextSplitter();
  const embeddings = new OpenAIEmbeddings();

  const docs = await loader.load();
  const chunkDocs = await splitter.splitDocuments(docs);

  const vectorstore = await MemoryVectorStore.fromDocuments(
    chunkDocs,
    embeddings
  );

  const retriever = vectorstore.asRetriever();

  const prompt =
    ChatPromptTemplate.fromTemplate(`Answer the following question based only on the provided context:

<context>
{context}
</context>

Question: {input}`);

  const documentChain = await createStuffDocumentsChain({
    llm: chatModel,
    prompt,
  });

  const retrievalChain = await createRetrievalChain({
    combineDocsChain: documentChain,
    retriever,
  });

  const result = await retrievalChain.invoke({
    input: userQuestion,
  });
  return result.answer;
}

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}/`);
});
