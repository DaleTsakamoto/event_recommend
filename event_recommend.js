const OpenAI = require("openai");
const math = require('mathjs');
const { Pinecone } = require("@pinecone-database/pinecone");

let OPEN_API_KEY = process.env.OPEN_API_KEY;
let PINECONE_API_KEY = process.env.PINECONE_API_KEY

const controller = async (req, res) => {
    QUERIES = ["Venue Name and Zip Code in California", "Basketball event", "Low Availibility"]
    AGGREGATION_METHOD = "WEIGHTED"
    WEIGHTS = [0.05, 0.9, 0.05 ]
    MODEL = "text-embedding-3-large"

    try {
        const pc = new Pinecone({
          apiKey: PINECONE_API_KEY
        });
    
        // Initialize OpenAI
        const client = new OpenAI({
          apiKey: OPEN_API_KEY,
        });
        const indexName = "event-recommendation-index-large-cosine";

            // Connect to the index
        async function connectToIndex() {
            const index = pc.Index(indexName);
            return index;
        }

        console.log("Grabbing queries embedding from Open AI");
        let xq = await client.embeddings.create({input: QUERIES, model: MODEL});
        let queryVector
        if (QUERIES.length > 1) {
            console.log("Applying " + AGGREGATION_METHOD + " function to list of query embeddings...");
            let queryEmbeddingList = xq.data.map(record => record.embedding);
            let average_embedding;
            if (AGGREGATION_METHOD === "AVERAGE") {
                average_embedding = math.mean(queryEmbeddingList, 0);
            } else if (AGGREGATION_METHOD === "WEIGHTED") {
                let weightArray = WEIGHTS;
                let sumWeights = math.sum(weightArray);
                let normalized_weights = math.divide(weightArray, sumWeights);
                // Reshape the normalized weights array to be a column vector
                let reshaped_weights = math.reshape(normalized_weights, [normalized_weights.length, 1]);
        
                let weight_embeddings = math.dotMultiply(queryEmbeddingList, reshaped_weights); // Element-wise multiplication
                average_embedding = math.sum(weight_embeddings, 0);
            }
            queryVector = average_embedding;
        } else {
            queryVector = [xq.data[0].embedding];
        }

        const index = await connectToIndex();
        let response = await index.query({vector: queryVector, topK: 10, includeMetadata: true});
        
        console.log("\n---------------------MATCHES----------------------");
        response.matches.forEach(match => {
            // console.log("MATCH", match)
            // console.log(`Similarity Score (${match.score.toFixed(2)}):\n${match.metadata.combined_text}\n`);
            console.log(`Similarity Score (${match.score.toFixed(2)}):\n${match.metadata.text}\n`);
            console.log("--------------------------------------------------\n");
        });
        res.json({ response: response });
        
    } catch (e) {
      console.log(e)
      res.status(404).json(e);
      return e;
    }
  };

  module.exports = {
    controller,
  };
  