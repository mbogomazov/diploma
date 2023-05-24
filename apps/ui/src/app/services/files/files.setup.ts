export const setupPackageJson = {
    file: {
        contents: `
{
"name": "example-app",
"type": "module",
"dependencies": {
  "express": "latest",
  "nodemon": "latest"
},
"scripts": {
  "start": "nodemon index.js"
}
}`,
    },
};
