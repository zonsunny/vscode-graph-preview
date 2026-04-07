# Graph Preview Test File

This file contains various diagram code blocks for testing the Graph Preview extension.

## Mermaid Tests

### Simple Flowchart

```mermaid
graph TB
  Client --> Gateway
  Gateway --> ServiceA
  Gateway --> ServiceB
  ServiceA --> Database
  ServiceB --> Database
```

### Sequence Diagram

```mermaid
sequenceDiagram
  participant User
  participant API
  participant DB

  User->>API: Request
  API->>DB: Query
  DB-->>API: Result
  API-->>User: Response
```

### Class Diagram

```mermaid
classDiagram
  class Animal {
    +String name
    +int age
    +makeSound()
  }
  class Dog {
    +String breed
    +bark()
  }
  Animal <|-- Dog
```

## DOT Tests

### Simple Graph

```dot
digraph {
  rankdir=LR
  a -> b -> c
  b -> d
  a -> d
}
```

### Complex Graph

```dot
digraph G {
  subgraph cluster_0 {
    style=filled;
    color=lightgrey;
    node [style=filled,color=white];
    a0 -> a1 -> a2 -> a3;
    label = "process #1";
  }
  subgraph cluster_1 {
    node [style=filled];
    b0 -> b1 -> b2 -> b3;
    label = "process #2";
    color=blue
  }
  start -> a0;
  start -> b0;
  a1 -> b3;
  b2 -> a3;
  a3 -> a0;
  a3 -> end;
  b3 -> end;
}
```

## PlantUML Tests

### Sequence Diagram

```plantuml
@startuml
Alice -> Bob: Authentication Request
Bob --> Alice: Authentication Response

Alice -> Bob: Another authentication Request
Alice <-- Bob: another authentication Response
@enduml
```

### Class Diagram

```plantuml
@startuml
class Animal {
  +String name
  +int age
  +void makeSound()
}

class Dog extends Animal {
  +String breed
  +void bark()
}
@enduml
```

## Edge Cases

### Empty Block (should not render)

```mermaid
```

### Config Only (should not render)

```mermaid
%%{init: {'theme': 'dark'}}
```

### Comment Only (should not render)

```mermaid
%% This is just a comment
```
