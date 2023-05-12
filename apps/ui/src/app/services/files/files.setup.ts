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

export const getHtmlFileCode = (
    template: string,
    style: string,
    script: string
) => `<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8" />
        <style type="text/css">
            ${style}
        </style>
    </head>
    <body>
        ${template}
    </body>
    <script>
        ${script}
    </script>
<html>`;

export const getIndexJsFile = (htmlCode: string) =>
    `import express from 'express';
const app = express();
const port = 3111;

app.get('/', (req, res) => {
res.send(\`${htmlCode}\`);
});

app.listen(port, () => {
console.log(\`App is live at http://localhost:\${port}\`);
});`;
