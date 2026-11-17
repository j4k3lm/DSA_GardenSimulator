# PROMPT LOG

| Version | Prompt/Request |
|---|---|
| v0.1.0 | (From my first request) Make the garden simulator for my DSA project with Python OOP, Stack, Queue, 2D list and a Hierarchical Tree. I use VS Code and the code must not be lost when the page is refreshed. First part: the resource storage and seed bag (Python OOP) from my starter code. |
| v0.2.0 | (From my first request) Stack: add an action history with an Undo button. |
| v0.3.0 | (From my first request) Queue: add the climate queue and a Next Day button. |
| v0.4.0 | (From my first request) 2D list: add the 5x5 garden grid for planting and harvesting. |
| v0.5.0 | "It is not like my starter code and many parts are missing, especially the resources. Make it follow my starter code (Resource Storage, Interactive Sanctuary and Student Code Editor tabs, Climate Queue, Action History) and make it more interactive, while keeping the requirements: Python OOP, Stack, Queue, 2D list and Hierarchical Tree." |
| v0.5.1 | "I cannot see the Hierarchical Tree. The Hierarchical Tree should look like this picture (A on top, B and C below, then D, E and F). Apply it." |
| v0.6.0 | "Next is tree traversal. Apply BFS and DFS (preorder, inorder, postorder). I must submit the updated journal and the GitHub repository." |
| v0.7.0 | "Next is the Binary Search Tree. Update my journal and include the specific block of code or function that powers each implementation, for example the lines that show how the hierarchical tree works. Guide me well because I am a beginner student." |
| v0.8.0 | "Add Node Mutation to the Binary Search Tree and apply it to my final project at my student level. Update my journal, prompt log and semantic versioning, each as a separate file that I can submit." |
| v0.9.0 | "Since we are at this part, I want my garden simulator to become a truly real game, like the games on Roblox or similar ones. Choose a reference that fits the requirements and instructions, but everything we added before must still be there. You are free to use any good reference game. Let us be creative." |
| v0.10.0 | "Next are AVL Trees, sorting algorithms (bubble, insertion, selection, quick, merge) and hash tables, collisions and rehashing. Write the study notes and integrate them into my Garden Simulator and journal, keeping everything we built before." |
| v0.10.1 | "I want everything in my game to be in English. Also, should the sorting and hash table notes be submitted separately from the journal?" |
| v0.10.2 | "Why is the title like that? It should be Garden Simulator because that is our project. Also fix the Board tab, it is outside the box. And let us add a relaxing background sound." |
| v0.10.3 | "I need a quiz reviewer for the upcoming quiz. Make sure everything is accurate and correct."|
| v1.0.0 | "We need to finalize our output because the final submission is today. Finalize everything that must be submitted according to all the instructions and requirements, and make sure there are no mistakes." Then: "The screenshots should capture everything in the game, especially the topics we implemented. What I will submit is the journal, the prompt log and semantic versioning, and the code."|

# SEMANTIC VERSIONING TAGS

| Version | Semantic Versioning Tag | Description |
|---|---|---|
| v0.1.0 | MINOR | Initial sketch: OOP resource storage and seed bag. |
| v0.2.0 | MINOR | Added the stack-based action history and the Undo button. |
| v0.3.0 | MINOR | Added the FIFO climate queue and the Next Day button. |
| v0.4.0 | MINOR | Added the 2D list garden grid with planting and harvesting. |
| v0.5.0 | MINOR | Rebuilt on my starter code: resource panel, tabs, hierarchical tree and more interactive play. |
| v0.5.1 | PATCH | Fixed the Hierarchical Tree not being visible: drew it as circles and lines and made it a binary tree. |
| v0.6.0 | MINOR | Added BFS and DFS (preorder, inorder, postorder) traversals with animation. |
| v0.7.0 | MINOR | Added the Binary Search Tree (insert, search, delete) linked to planting, harvesting and undo. Journal now shows code blocks. |
| v0.8.0 | MINOR | Rewrote the BST with recursive insert, search, delete and find_min and added node mutation (plant stage and health, Water and Pesticide tools, dead plants), the Inspect tool, and a balance check with rebuild. |
| v0.9.0 | MINOR | Turned the simulator into a real-time game (inspired by Grow a Garden and Stardew Valley): 6x6 field, weather queue with effects, seed shop restock, fruit weight and mutations, basket and selling, neighbor order queue, quests, levels, sounds, hotkeys, auto-save. All earlier DSA structures kept and now used by the gameplay (postorder = Prune Dead). New DSA Lab tab and requirements map. |
| v0.10.0 | MINOR | Added the AVL tree (rotations LL, RR, LR, RL; the garden tree now balances itself), five sorting algorithms (Insertion Sort for the Basket, Merge Sort for the Leaderboard and Shop, Sorting Lab animation), and a hash table with chaining, rehashing and an open addressing demo (plant ID registry, Hash Table Lab). Journal has the sorting and hash table notes. Nothing from earlier versions was removed. |
| v0.10.1 | PATCH | Translated the whole game to English (messages, buttons, quests, crop and weather names, requirements map). Renamed weather keys (Typhoon, Pests) and crops (Cabbage, Tomato, Eggplant, Chili, Corn, Watermelon, Rice, Banana, Mango). Added separate submission files for the sorting and hash table notes. No new features; old saves are cleared by the version check. |
| v0.10.2 | PATCH | Title is now Python-Based Garden Simulator. Fixed the side tabs so Board stays inside the box. Added relaxing background music (generated with WebAudio, with a music on/off button and weather sounds). |
| v0.10.3 | PATCH | Documentation only: corrected a collision example and the measured comparison counts in the notes, and added the quiz reviewer. No game changes. |
| v1.0.0 | MAJOR | **Final release.** AVL balance factor is now right height minus left height; real screenshots, final Journal Sections 7, 8, 10 and 11, and the final test run (stress tests 0 failures, 54 of 54 browser checks). |

Rule: MAJOR = breaking change or first stable release (x.0.0). MINOR = new backward-compatible feature (0.x.0). PATCH = bug fix (0.0.x). Versions that start with 0. are in the pre-release phase; v1.0.0 is the final release.
