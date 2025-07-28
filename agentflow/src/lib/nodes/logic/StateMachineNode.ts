import { BaseNode, NodeContext } from "../base/BaseNode";
import { NodeOutput } from "@/types";

interface StateTransition {
  from: string;
  to: string;
  event: string;
  condition?: string;
}

interface StateMachineNodeData {
  states?: string[];
  initialState?: string;
  transitions?: StateTransition[];
  currentState?: string;
  persistState?: boolean;
}

export class StateMachineNode extends BaseNode {
  private static stateStore = new Map<string, string>();

  async execute(context: NodeContext): Promise<NodeOutput> {
    const data = this.node.data as StateMachineNodeData;
    const states = data.states || [];
    const initialState = data.initialState || states[0] || "initial";
    const transitions = data.transitions || [];
    const persistState = data.persistState ?? true;

    // Get current state
    const currentState = persistState
      ? StateMachineNode.stateStore.get(this.node.id) ||
        data.currentState ||
        initialState
      : data.currentState || initialState;

    // Get event from input
    const inputValues = this.getInputValues(context);
    const event = inputValues[0] || "";

    // Find applicable transitions
    const applicableTransitions = transitions.filter(
      (t) => t.from === currentState && t.event === event
    );

    if (applicableTransitions.length === 0) {
      return {
        currentState,
        event,
        message: `No transition found for event "${event}" in state "${currentState}"`,
      };
    }

    // Execute transition
    const transition = applicableTransitions[0];
    const newState = transition.to;

    // Update state
    if (persistState) {
      StateMachineNode.stateStore.set(this.node.id, newState);
    }

    return {
      previousState: currentState,
      currentState: newState,
      event,
      transition: `${currentState} -> ${newState}`,
      output: newState,
    };
  }

  static clearState(nodeId?: string) {
    if (nodeId) {
      this.stateStore.delete(nodeId);
    } else {
      this.stateStore.clear();
    }
  }
}
