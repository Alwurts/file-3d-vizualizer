# 3D File Explorer

## Description

3D File Explorer is a desktop application that provides a three-dimensional visualization of your file system. Built with Electron, React, and Three.js, this application offers a unique way to explore and interact with your folders and files.

This project was a quick 3-hour experiment, primarily developed using Cursor AI. It's a fun, exploratory project rather than a production-ready application.

## Features

- 3D visualization of folder contents
- Interactive file and folder exploration
- Sorting options (by name, size, or type)
- Navigation to parent directories
- Option to always display file/folder names

## Prerequisites

Before you begin, ensure you have met the following requirements:

- Node.js
- npm

## Installation

To install the 3D File Explorer, follow these steps:

1. Clone the repository
2. Navigate to the project directory
3. Install the dependencies:
   ```
   npm install
   ```

## Usage

### Development Mode

To run the application in development mode:

```
npm run dev
```

This command will start the Vite development server and launch the Electron application.

### Building the Application

To build the application for production:

```
npm run build
```


This command will compile the TypeScript code, build the Vite application, and use electron-builder to create distributable packages for your platform.

## Project Structure

- `src/`: Contains the React application source code
- `electron/`: Contains the Electron main process code
- `dist/`: Built files (created after running the build command)
- `dist-electron/`: Compiled Electron files

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgements

This project was primarily developed using Cursor AI, demonstrating the potential of AI-assisted coding for rapid prototyping and experimentation.