# Reporting MCP Server

This MCP Server has two tools - 
1. retrieve-file-content: Retrieve the file contents from URL
2. upload-csv: Imports csv dataset and summary for the retrieved dataset to google sheet in form of a presentation 

## Note:
The Reporting MCP server is a demo to illustrate this end-to-end agent flow. Any other reporting or visualization service could be integrated in its place. It is outside of the core Skyfire flow.

## Getting Started (optional)

- Set up a Google Apps Script:

To start using Google Apps Script, you need to create a new project, either standalone or bound to a Google Workspace document like a sheet or doc.

Here's a step-by-step breakdown:

1. Access the Apps Script Editor:
From a Google Workspace document: Open a Google Sheet, Doc, or Slide, and navigate to Extensions > Apps Script. 
2. Create a new project:
If you're starting from a document, the editor will open with a container-bound script. 
3. Name your project:
Click on the default project name (usually "Untitled project") to rename it. 
4. Write your code:
The editor provides a code editor where you can write your JavaScript code. You can use this starter code to create a presentation in Google Sheets.

```
function doPost(e) {
  const url = e.parameter.url;
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  try {

    const summary = e.postData.contents || "No summary found";

    const response = UrlFetchApp.fetch(url.trim());
    const csv = response.getContentText();
    const data = Utilities.parseCsv(csv);

    sheet.clearContents();
    sheet.getRange(1, 1).setValue(summary);
    sheet.getRange(5, 1, data.length, data[0].length).setValues(data);
    
    return ContentService.createTextOutput('Sheet updated successfully at <your_google_sheet_url>' + JSON.stringify(e)).setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    return ContentService.createTextOutput('Error:1 ' + err.message).setMimeType(ContentService.MimeType.TEXT);
  }
}
```
5. Save your project
6. Deploy:
If you want to share your script or use it as a web app, you'll need to deploy it.

## Note:
Setting up Google Apps Script is only required for the flow wherein a presentation is created for the downloaded dataset using the upload-csv tool.

## Installation

1.  Install dependencies:
    ```bash
    cd reporting-mcp-server
    npm install
    ```
2.  Set up environment variables:
    Create a `.dev.vars` file in the root directory. You can copy `.dev.vars.example` if one exists, or add the necessary variables manually.

    ```
    # .dev.vars
    DEPLOYED_GOOGLE_APPS_SCRIPT_URL=your_google_apps_script_deployment_url
    ```

## Run the development server:

```bash
npm run dev
```

The MCP server will run on [http://localhost:8790/sse](http://localhost:8790/sse).