const OpenAI = require("openai");
const math = require('mathjs');
const { Pinecone } = require("@pinecone-database/pinecone");

const {
    createDataArrays,
    parseEvent
} = require("./templates")

let OPEN_API_KEY = "sk-evengine-service-AmqsQYnCriT55BjyF3l3T3BlbkFJDKkpMO7GKFPhw5VhMfc5";
// let OPEN_API_KEY = process.env.OPEN_API_KEY;
let PINECONE_API_KEY = "90647a75-db12-4cbb-ab3b-0445a8db2c8d"
// let PINECONE_API_KEY = process.env.PINECONE_API_KEY

const controller = async (req, res) => {
    const {zipcodesQuery, daysOfWeekQuery, activitiesQuery, organizationsQuery, venuesQuery, textQuery} = createDataArrays(req.body)
    const createArrayFromQueries = (...queries) => queries.filter(Boolean);

    QUERIES = createArrayFromQueries(zipcodesQuery, daysOfWeekQuery, activitiesQuery, organizationsQuery, venuesQuery, textQuery);
    // console.log("QUERIES", QUERIES)
    AGGREGATION_METHOD = "WEIGHTED"
    WEIGHTS = [0.25, 0.25, 0.2, 0.2, 0.1]
    WEIGHTSWITHUSERQUERY = [0.125, 0.125, 0.1, 0.1, 0.05, 0.5]
    MODEL = "text-embedding-3-large"

    try {
        const pc = new Pinecone({
          apiKey: PINECONE_API_KEY
        });
    
        // Initialize OpenAI
        const client = new OpenAI({
          apiKey: OPEN_API_KEY,
        });
        const indexName = "event-recommendation-index-70k";

            // Connect to the index
        async function connectToIndex() {
            const index = pc.Index(indexName);
            return index;
        }

        // console.log("Grabbing queries embedding from Open AI");
        let xq = await client.embeddings.create({input: QUERIES, model: MODEL});
        let queryVector
        if (QUERIES.length > 1) {
            // console.log("Applying " + AGGREGATION_METHOD + " function to list of query embeddings...");
            let queryEmbeddingList = xq.data.map(record => record.embedding);
            let average_embedding;
            if (AGGREGATION_METHOD === "AVERAGE") {
                average_embedding = math.mean(queryEmbeddingList, 0);
            } else if (AGGREGATION_METHOD === "WEIGHTED") {
                let weightArray = QUERIES.length > 5 ? WEIGHTSWITHUSERQUERY: WEIGHTS;
                // console.log("WEIGHTARRYA", weightArray)
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

        let response = await index.query({vector: queryVector, topK: 5, includeMetadata: true});

        
        // console.log("\n---------------------MATCHES----------------------");
        // response.matches.forEach(match => {
        //     // console.log("MATCH", match)
        //     // console.log(`Similarity Score (${match.score.toFixed(2)}):\n${match.metadata.combined_text}\n`);
        //     console.log(`Similarity Score (${match.score.toFixed(2)}):\n${match.metadata.text}\n`);
        //     console.log("--------------------------------------------------\n");
        // });

        const recommendedEvents = response.matches.map(match => {
            const text = match.metadata.text;
            const score = match.score;
            return parseEvent(text, score);
          });

        // const output = { "recommendedEvents": recommendedEvents };
        
        // console.log(JSON.stringify(output, null, 2));
        res.json({ recommendedEvents });
        
    } catch (e) {
      console.log(e)
      res.status(404).json(e);
      return e;
    }
  };

  module.exports = {
    controller,
  };
  