"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Canvas } from "@/components/Canvas";
import { AgentSidebar } from "@/components/AgentSidebar";
import {
  Play,
  Settings,
  Share,
  Download,
  Plus,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

// Define a Project type
interface Project {
  name: string;
  llm: string;
  personality: string;
  lastModified?: Date;
}


export default function Home() {
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard'>('landing');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [hasProject, setHasProject] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project>({
    name: "Customer Support Agent",
    llm: "OpenAI GPT-4",
    personality: "Helpful & Professional",
  });

  const handleCreateProject = (projectData: any) => {
    setCurrentProject({
      name: projectData.name || "New Agent",
      llm: "OpenAI GPT-4",
      personality: "Friendly",
    });
    setHasProject(true);
    setCurrentView('dashboard');
  };

  // Welcome screen for new users
  if (currentView === 'landing' || !hasProject) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="max-w-2xl text-center p-8">
          <div className="mb-8">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome to AgentFlow
            </h1>
            <p className="text-lg text-muted-foreground">
              Design, test, and deploy intelligent agent
              conversations without writing code
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <Card className="p-4 text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <h3 className="font-medium mb-1">
                Smart Analytics
              </h3>
              <p className="text-sm text-muted-foreground">
                Real-time confidence tracking and sentiment
                routing
              </p>
            </Card>
            <Card className="p-4 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-medium mb-1">
                Live Collaboration
              </h3>
              <p className="text-sm text-muted-foreground">
                Work together with your team in real-time
              </p>
            </Card>
            <Card className="p-4 text-center">
              <Zap className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <h3 className="font-medium mb-1">
                Instant Testing
              </h3>
              <p className="text-sm text-muted-foreground">
                Test AI behavior live during design
              </p>
            </Card>
          </div>

          <div className="space-y-4">
            <Button
              size="lg"
              className="gap-2"
              onClick={() => {
                setHasProject(true);
                setCurrentView('dashboard');
              }}
            >
              <Plus className="w-5 h-5" />
              Create Your First Agent
            </Button>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <Badge variant="outline">
                No coding required
              </Badge>
              <Badge variant="outline">
                Visual flow builder
              </Badge>
              <Badge variant="outline">
                Multi-agent support
              </Badge>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Dashboard
  return (
    <div className="flex h-screen w-full bg-background">
      {/* Left Sidebar - Agent Library */}
      <AgentSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        <div className="h-16 border-b border-border bg-background px-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-6 h-6 text-primary" />
              <span className="font-semibold">AgentFlow</span>
            </div>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">{currentProject.name}</span>
              <span className="text-xs text-muted-foreground">{currentProject.llm}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant={isSimulating ? "default" : "outline"}
              size="sm"
              onClick={() => setIsSimulating(!isSimulating)}
              className="gap-2"
            >
              <Play className="w-4 h-4" />
              {isSimulating ? "Stop Test" : "Test Flow"}
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Share className="w-4 h-4" />
              Share
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setCurrentView('landing')}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Main Canvas and Panels */}
        <div className="flex-1 flex">
          {/* Canvas */}
          <div className="flex-1 relative">
            <Canvas 
              onNodeSelect={setSelectedNode}
              selectedNode={selectedNode}
            />

            {/* Simulation Panel (Bottom overlay when active) */}
            {isSimulating && (
              <div className="absolute bottom-0 left-0 right-0 h-80 border-t border-border bg-background">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">Agent Testing Environment</h3>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setIsSimulating(false)}
                    >
                      ✕
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <div className="bg-muted p-3 rounded-lg">
                          <div className="text-sm font-medium mb-1">Test Input:</div>
                          <div className="text-sm">Process customer complaint about delayed shipping</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <div className="bg-primary/10 p-3 rounded-lg">
                          <div className="text-sm font-medium mb-1">Agent Output:</div>
                          <div className="text-sm">1. Analyzed sentiment: Frustrated<br/>2. Retrieved order details<br/>3. Generated empathetic response<br/>4. Escalated to human for resolution</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Properties Panel */}
          <div className="w-80 border-l border-border bg-muted/30">
            <div className="p-4 border-b border-border">
              <h3 className="font-medium">Agent Properties</h3>
            </div>
            <div className="p-4">
              {selectedNode ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Agent Type</label>
                    <p className="text-sm text-muted-foreground">Writer Agent</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Personality</label>
                    <select className="w-full mt-1 p-2 border rounded-md text-sm">
                      <option>Professional</option>
                      <option>Friendly</option>
                      <option>Technical</option>
                      <option>Creative</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Output Style</label>
                    <textarea 
                      className="w-full mt-1 p-2 border rounded-md text-sm" 
                      rows={3}
                      placeholder="Concise, bullet-pointed responses with action items..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Confidence Threshold</label>
                    <input 
                      type="range" 
                      className="w-full mt-1" 
                      min="0" 
                      max="100" 
                      defaultValue="75"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Low</span>
                      <span>High</span>
                    </div>
                  </div>
                  <Button size="sm" className="w-full">
                    Test This Agent
                  </Button>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Select an agent to configure its properties
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}