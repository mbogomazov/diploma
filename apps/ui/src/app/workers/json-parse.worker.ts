/// <reference lib="webworker" />

addEventListener('message', ({ data }) => {
    const response = JSON.parse(data);
    postMessage(response);
});
