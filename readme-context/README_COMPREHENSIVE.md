# AgentFlow - Visual AI Agent Design Platform

## 🎯 Overview

AgentFlow is a **Figma for AI Agents** - a visual, intuitive platform for designing, testing, and prototyping agentic workflows before implementation. It empowers non-technical users (UX designers, product managers) and developers to map out complex AI agent behaviors without writing code.

### Key Value Proposition
When building AI applications with tools like Windsurf or Cursor, providing comprehensive context about desired functionality is challenging. AgentFlow solves this by letting users:
1. **Visually design** agent workflows with drag-and-drop simplicity
2. **Simulate and test** workflows with LLM-powered mock execution
3. **Export as MCP** (Model Context Protocol) for seamless integration with AI coding assistants

## 🚀 Features

### 📊 Project Dashboard
- **Multiple view modes**: List, Kanban, Grid, and Table views
- **Project management**: Create, organize, and manage multiple agent workflow projects
- **Quick access**: Jump into any project's workflow designer instantly

### 🎨 Visual Workflow Designer
- **Drag-and-drop canvas**: Infinite, zoomable workspace like Figma
- **Component library**: Pre-built nodes for different agent types
- **Real-time connections**: Visual flow connections between nodes
- **Properties panel**: Configure each node's behavior and parameters

### 🧩 Node Types

#### **Agent Node** 
- Core reasoning component
- Analyzes inputs and makes decisions
- Configurable behavior and system prompts
- Context-aware processing

#### **Tool Agent Node**
- Simulates external tool interactions (web search, calendar, database)
- Mock data generation for testing
- Configurable tool parameters

#### **Knowledge Base Node**
- Upload and process documents (PDFs, text files)
- Provides contextual information to connected agents
- Semantic retrieval capabilities

#### **Decision Tree Node**
- Conditional branching logic
- Multiple output paths
- Rule-based routing

#### **Other Nodes**
- Message formatting
- Template processing
- State management
- Testing components

### 🧪 Testing Panel
- **Step-by-step execution**: Watch your workflow run node by node
- **Real-time results**: See outputs, reasoning, and data flow
- **Timeline visualization**: Track execution progress
- **Mock environment**: Test without external dependencies
- **Error handling**: Identify and debug issues quickly

### 📤 MCP Export
- **Comprehensive context**: Generates detailed workflow documentation
- **AI-ready format**: Optimized for Windsurf/Cursor integration
- **Includes**:
  - Complete workflow structure
  - Node configurations and behaviors
  - Test scenarios and expected outcomes
  - Knowledge base assets
  - Contextual descriptions for AI understanding

## 🛠️ Technical Stack

- **Frontend**: Next.js 14, React, TypeScript
- **UI Components**: Custom Figma-inspired design system
- **Canvas**: React Flow for node-based editing
- **Styling**: Tailwind CSS with custom theme
- **Backend**: Supabase for data persistence
- **AI Integration**: Gemini API for LLM simulation
- **Testing**: Vitest for unit tests

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/agentflow.git
cd agentflow

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev
```

## 🔧 Configuration

### Environment Variables
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Gemini API (for LLM simulation)
GEMINI_API_KEY=your_gemini_api_key

# Optional: Other AI providers
NVIDIA_API_KEY=your_nvidia_api_key
```

## 💡 Usage Guide

### Creating Your First Workflow

1. **Start a New Project**
   - Open the dashboard
   - Click "Create Project"
   - Name your project and add a description

2. **Design Your Workflow**
   - Drag nodes from the component library
   - Connect nodes to define data flow
   - Click on nodes to configure their properties

3. **Configure Agents**
   - Set behavior instructions
   - Define reasoning patterns
   - Connect to knowledge bases or tools

4. **Test Your Design**
   - Click the "Test" button
   - Provide test inputs
   - Watch the step-by-step execution
   - Review outputs and reasoning

5. **Export for Implementation**
   - Click "Export as MCP"
   - Import into Windsurf/Cursor
   - Use the context to build your application

## 🎯 Use Cases

### Customer Support Bot
Design a workflow that:
- Receives customer queries
- Searches knowledge base
- Escalates to human if needed
- Formats professional responses

### Data Processing Pipeline
Create agents that:
- Extract data from documents
- Transform and validate
- Make decisions based on rules
- Output structured results

### Personal Assistant
Build a system that:
- Understands user requests
- Accesses calendar and email
- Schedules appointments
- Sends confirmations

## 🏗️ Architecture

```
AgentFlow/
├── src/
│   ├── app/              # Next.js app router
│   ├── components/       # React components
│   │   ├── canvas/       # Workflow designer
│   │   ├── panels/       # Properties panels
│   │   └── dashboard/    # Project management
│   ├── lib/              # Core logic
│   │   ├── mcp/          # MCP export
│   │   ├── nodes/        # Node definitions
│   │   └── workflow/     # Execution engine
│   └── types/            # TypeScript definitions
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by Figma's intuitive design interface
- Built for the Windsurf/Cursor AI development ecosystem
- Powered by modern web technologies

## 📞 Support

- **Documentation**: [docs.agentflow.dev](https://docs.agentflow.dev)
- **Issues**: [GitHub Issues](https://github.com/yourusername/agentflow/issues)
- **Discord**: [Join our community](https://discord.gg/agentflow)

---

**AgentFlow** - Empowering everyone to design intelligent AI workflows 🚀
