const anthropic = require("@anthropic-ai/sdk");

const client = new anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

function reviewPipeline(files) {
    for f in files:
        anthropic.review_pipeline(f)

    return anthropic.review_pipeline(files)
}

function dynamicDecomposition(task) {
    return anthropic.dynamic_decomposition(task)
}