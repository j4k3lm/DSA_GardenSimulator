# DSA Technical Journal: Python-Based Garden Simulator (v1.0.0)

## 1. Project Overview
The Python-Based Garden Simulator is a real-time browser farming game (SDG 2, 13, 15) inspired by *Grow a Garden* (Roblox) and *Stardew Valley*. The player rebuilds a barangay garden: buy seeds in a restocking shop, plant on a 6x6 field, survive weather, harvest fruit with weights and mutations, sell the basket or deliver neighbor orders, finish quests and raise Community Hope to 100. **All game rules are Python** running in the browser with Pyodide; JavaScript only draws the screen. Platform: HTML5, Tailwind CSS (CDN), Lucide Icons (CDN), Pyodide, Vanilla JavaScript. DSA used: Python OOP, 2D list, Stack, Queue, Hierarchical Tree, BFS and DFS, Binary Search Tree, Node Mutation, **AVL Tree, Sorting (5 algorithms) and Hash Tables (chaining and open addressing, rehashing)**.

## 2. Current Project Progress
The game is finished (v1.0.0). Every topic below is implemented in Python, is used by the real gameplay, and can be seen in the game or in the DSA Lab tab. The version history is in the separate Prompt Log and Semantic Versioning file.

| Requirement | Where it is in the game | Status |
|---|---|---|
| Python OOP | `Crop`, `ResourceStorage`, `Plant`, `GardenGrid`, `GardenTree(BinaryTree)`, `BSTNode`, `BST`, `AVLTree(BST)`, `HashTable`, `OpenAddressTable`, `Game` | Implemented |
| 2D List / Array | `GardenGrid.cells[row][col]` 6x6 field | Implemented |
| Stack | `ActionHistoryStack`: Undo | Implemented |
| Queue | `ClimateQueue` (weather) and `OrderQueue` (neighbors), `deque` | Implemented |
| Hierarchical Tree | `GardenTree` (root Garden, plants as nodes) | Implemented |
| BFS / DFS | `bfs`, `preorder`, `inorder`, `postorder`; postorder = Prune Dead, inorder = every tick and Harvest All | Implemented |
| BST + Node Mutation | insert / search / delete (3 cases), `refresh`, `copy_from` | Implemented |
| AVL Tree | the garden tree is now an `AVLTree`: rotations keep it balanced | Implemented |
| Sorting | Insertion Sort for the basket, Merge Sort for the leaderboard, all 5 algorithms in the Sorting Lab | Implemented |
| Hash Table | plant ID registry (chaining) that rehashes as the garden grows; Hash Table Lab with chaining vs open addressing | Implemented |

## 3. Implemented Data Structures

### 3.1 Python OOP
A class is a blueprint; each object has its own data and methods.

```python
   5 | class Crop:
   6 |     """Blueprint of one kind of plant. Crop(...) makes one object from this class."""
   7 |     def __init__(self, name, emoji, category, seed_cost, grow_secs, value, level, rarity, weight):
   8 |         self.name, self.emoji, self.category = name, emoji, category
   9 |         self.seed_cost, self.grow_secs = seed_cost, grow_secs     # seed price, seconds to ripen
  10 |         self.value, self.level, self.rarity = value, level, rarity  # sell price, unlock level, shop rarity
  11 |         self.weight = weight                                      # average weight (kg)
  12 | 
  13 | CROPS = [
  14 |     Crop("Cabbage",    "🥬", "Vegetable", 5,  20,   9, 1, "common",   0.4),
  15 |     Crop("Tomato",   "🍅", "Vegetable", 8,  30,  15, 1, "common",   0.3),
  16 |     Crop("Basil",     "🌿", "Herb",      6,  25,  12, 1, "common",   0.1),
  17 |     Crop("Eggplant",    "🍆", "Vegetable", 12, 40,  24, 2, "common",   0.5),
  18 |     Crop("Chili",      "🌶️", "Vegetable", 14, 45,  28, 2, "uncommon", 0.1),
  19 |     Crop("Sunflower", "🌻", "Flower",    15, 50,  32, 2, "uncommon", 0.6),
  20 |     Crop("Corn",      "🌽", "Grain",     20, 60,  42, 3, "uncommon", 0.4),
  21 |     Crop("Watermelon",    "🍉", "Fruit",     35, 80,  80, 3, "rare",     4.0),
  22 |     Crop("Rice",     "🌾", "Grain",     25, 70,  55, 4, "uncommon", 0.3),
  23 |     Crop("Banana",    "🍌", "Fruit",     45, 100, 110, 4, "rare",    1.2),
  24 |     Crop("Mango",    "🥭", "Fruit",     70, 140, 190, 5, "rare",    0.6),
  25 | ]
  26 | CROP_BY_NAME = {c.name: c for c in CROPS}      # dictionary: fast lookup by name
  27 | LEVEL_XP = [0, 40, 110, 220, 380]              # xp needed for level 1..5
  28 | 
  29 | class ResourceStorage:
  30 |     """Everything the player owns: coins, water, energy, hope, seed bag and fruit basket."""
  31 |     MAX = {"water": 100, "energy": 100, "hope": 100}
  32 |     BASKET_MAX = 40
  33 |     def __init__(self):
  34 |         self.coins, self.xp = 40, 0
  35 |         self.water, self.energy, self.hope = 100.0, 60.0, 20.0
  36 |         self.seeds = {"Cabbage": 3, "Tomato": 2}   # seed bag: crop name -> how many seeds
  37 |         self.basket = []                           # harvested fruits waiting to be sold
  38 |     def level(self):
  39 |         lv = 1
  40 |         for i, need in enumerate(LEVEL_XP):
  41 |             if self.xp >= need:
  42 |                 lv = i + 1
  43 |         return lv
  44 |     def change(self, **delta):                     # e.g. change(coins=-10, water=-3)
  45 |         for k, v in delta.items():
  46 |             val = getattr(self, k) + v
  47 |             setattr(self, k, max(0, min(val, self.MAX.get(k, 10 ** 9))))
  48 |     def can_afford(self, coins=0, water=0, energy=0):
  49 |         return self.coins >= coins and self.water >= water and self.energy >= energy
  50 |     def add_seed(self, name, n=1):
  51 |         self.seeds[name] = self.seeds.get(name, 0) + n
  52 |     def use_seed(self, name):                      # True if we had a seed to use
  53 |         if self.seeds.get(name, 0) <= 0:
  54 |             return False
  55 |         self.seeds[name] -= 1
  56 |         if self.seeds[name] == 0:
  57 |             del self.seeds[name]
  58 |         return True
  59 |     def basket_full(self):
  60 |         return len(self.basket) >= self.BASKET_MAX
```
**Key lines to explain**

| Line | What it does |
|---|---|
| 5 | blueprint of one kind of plant |
| 26 | dictionary: O(1) lookup by name |
| 29 | one object holds all player resources |
| 44 | one method changes any resource and clamps it to its maximum |


### 3.2 2D List / Array

```python
 134 | class Plant:
 135 |     """One growing plant. It is shared by the grid cell AND the BST node (same object)."""
 136 |     def __init__(self, crop):
 137 |         self.crop = crop
 138 |         self.uid = None                      # unique plant ID (key of the hash table)
 139 |         self.progress = 0.0                  # seconds grown
 140 |         self.health = "Healthy"              # Healthy / Wilted / Pest-Infested / Dead
 141 |         self.sick_secs = 0.0                 # how long it has been sick
 142 |         self.boost = 0.0                     # seconds of fast growth left (watered / solar boost)
 143 |         self.mutation = None                 # None / Wet / Shocked / Gold / Rainbow
 144 |         self.weight = round(crop.weight * random.uniform(0.8, 1.4), 2)
 145 |     def ripe(self):
 146 |         return self.progress >= self.crop.grow_secs
 147 |     def stage_name(self):
 148 |         if self.health == "Dead":
 149 |             return "Dead"
 150 |         if self.ripe():
 151 |             return "Mature"
 152 |         return "Seedling" if self.progress < self.crop.grow_secs / 3 else "Growing"
 153 |     def set_mutation(self, name):            # keep the BEST mutation only
 154 |         if MUTATIONS[name] > MUTATIONS.get(self.mutation, 1):
 155 |             self.mutation = name
 156 |             return True
 157 |         return False
 158 |     def value(self):                         # heavier and mutated fruit sells for more
 159 |         mult = MUTATIONS.get(self.mutation, 1)
 160 |         return max(1, round(self.crop.value * (self.weight / self.crop.weight) * mult))
 161 |     def cure(self):
 162 |         self.health, self.sick_secs = "Healthy", 0.0
 163 |     def grow(self, dt, weather_mult):        # called every game second
 164 |         if self.health == "Dead":
 165 |             return
 166 |         if self.health != "Healthy":         # sick plants do not grow and may die
 167 |             self.sick_secs += dt
 168 |             if self.sick_secs >= DEATH_SECONDS:
 169 |                 self.health = "Dead"
 170 |             return
 171 |         speed = weather_mult * (1.5 if self.boost > 0 else 1.0)
 172 |         self.boost = max(0.0, self.boost - dt)
 173 |         self.progress = min(self.crop.grow_secs, self.progress + dt * speed)
 174 | 
 175 | class GardenGrid:
 176 |     """2D LIST: cells[row][col] holds a Plant or None."""
 177 |     def __init__(self, rows=SIZE, cols=SIZE):
 178 |         # a list comprehension makes a NEW inner list for every row.
 179 |         # (Not [[None]*cols]*rows: that repeats the SAME row and breaks the grid!)
 180 |         self.rows, self.cols = rows, cols
 181 |         self.cells = [[None for _ in range(cols)] for _ in range(rows)]
 182 |     def in_range(self, r, c):
 183 |         return 0 <= r < self.rows and 0 <= c < self.cols
 184 |     def is_empty(self, r, c):                # O(1) direct index
 185 |         return self.cells[r][c] is None
 186 |     def place(self, r, c, plant):            # O(1)
 187 |         self.cells[r][c] = plant
 188 |     def remove(self, r, c):                  # O(1)
 189 |         p = self.cells[r][c]
 190 |         self.cells[r][c] = None
 191 |         return p
 192 |     def count(self):                         # O(rows * cols): nested loops
 193 |         return sum(1 for row in self.cells for p in row if p)
```
**Key lines to explain**

| Line | What it does |
|---|---|
| 175 | the 2D list |
| 181 | each row is a NEW list (not `[[None]*n]*n`) |
| 184 | direct index = O(1) |
| 138 | every plant gets a unique ID: the key of the hash table |


### 3.3 Stack (LIFO)
Undo must cancel the newest planting first.

```python
  63 | 2: { title: "2 · Stack: Action History / Undo (LIFO)", expect: "history", code: `class ActionHistoryStack:
  64 |     """STACK (LIFO): the newest action is on top, so Undo takes it first."""
  65 |     LIMIT = 20
  66 |     def __init__(self):
  67 |         self.items = []                      # top of the stack = last element
  68 |     def push(self, action):                  # O(1) (append at the end)
  69 |         self.items.append(action)
  70 |         if len(self.items) > self.LIMIT:
  71 |             self.items.pop(0)                # forget the oldest action
  72 |     def pop(self):                           # O(1) (remove from the end)
  73 |         return self.items.pop() if self.items else None
  74 |     def peek(self):                          # look at the top without removing
  75 |         return self.items[-1] if self.items else None
  76 |     def is_empty(self):
  77 |         return len(self.items) == 0
  78 |     def size(self):
  79 |         return len(self.items)
```
```python
1143 |     def act_undo(self):
1144 |         a = self.history.pop()                   # STACK: newest action first
1145 |         if a is None: return "Nothing to undo (the stack is empty)."
1146 |         p = self.plant_at(a["r"], a["c"])
1147 |         if p is None or p.crop.name != a["crop"]: return "That plant is gone."
1148 |         self.remove_plant(a["r"], a["c"])
1149 |         self.res.add_seed(a["crop"])
1150 |         self.say("sfx", name="undo")
1151 |         return "Undo: returned the %s seed." % a["crop"]
```

### 3.4 Queue (FIFO)
Weather and customers are served in arrival order. `deque.popleft()` is O(1).

```python
  97 | class ClimateQueue:
  98 |     """QUEUE (FIFO): the first weather that entered is the first to happen."""
  99 |     SIZE = 4
 100 |     def __init__(self):
 101 |         self.items = deque(["Sunny", "Rain"])
 102 |         self.fill()
 103 |     def enqueue(self, event):                # O(1) add at the back
 104 |         self.items.append(event)
 105 |     def dequeue(self):                       # O(1) remove from the front
 106 |         return self.items.popleft() if self.items else None
 107 |     def fill(self):                          # keep the forecast full
 108 |         names = list(WEATHER_WEIGHTS)
 109 |         while len(self.items) < self.SIZE:
 110 |             self.enqueue(random.choices(names, [WEATHER_WEIGHTS[n] for n in names])[0])
 111 | 
 112 | class OrderQueue:
 113 |     """QUEUE (FIFO): neighbors line up. You serve the one at the FRONT first."""
 114 |     MAX = 4
 115 |     def __init__(self):
 116 |         self.items = deque()
 117 |         self.next_id = 1
 118 |     def enqueue(self, order):                # new customer joins the back
 119 |         self.items.append(order)
 120 |     def dequeue(self):                       # front customer leaves
 121 |         return self.items.popleft() if self.items else None
 122 |     def front(self):
 123 |         return self.items[0] if self.items else None
 124 |     def is_full(self):
 125 |         return len(self.items) >= self.MAX
```

### 3.5 Hierarchical Tree

```python
 199 | class TreeNode:
 200 |     _next_id = 0
 201 |     def __init__(self, name, label=None, pos=None, cat="Garden"):
 202 |         TreeNode._next_id += 1
 203 |         self.id = TreeNode._next_id
 204 |         self.name, self.label, self.pos, self.cat = name, label or name, pos, cat
 205 |         self.parent = self.left = self.right = None
 206 |     def depth(self):                         # root = 0
 207 |         return 0 if self.parent is None else 1 + self.parent.depth()
 208 |     def height(self):                        # leaf = 0, O(n)
 209 |         l = self.left.height() if self.left else -1
 210 |         r = self.right.height() if self.right else -1
 211 |         return 1 + max(l, r)
 212 |     def size(self):                          # O(n)
 213 |         return 1 + (self.left.size() if self.left else 0) + (self.right.size() if self.right else 0)
 214 |     def to_dict(self):
 215 |         return {"id": self.id, "label": self.label, "name": self.name, "cat": self.cat,
 216 |                 "left": self.left.to_dict() if self.left else None,
 217 |                 "right": self.right.to_dict() if self.right else None}
 218 | 
 219 | class BinaryTree:
 220 |     def __init__(self, root):
 221 |         self.root = root
 222 |     def _level_list(self):                   # nodes top-to-bottom, left-to-right (BFS)
 223 |         out, q = [], deque([self.root])
 224 |         while q:
 225 |             n = q.popleft()
 226 |             out.append(n)
 227 |             if n.left:  q.append(n.left)
 228 |             if n.right: q.append(n.right)
 229 |         return out
 230 |     def insert(self, node):                  # first free slot, O(n)
 231 |         for cur in self._level_list():
 232 |             if cur.left is None:  cur.left = node;  node.parent = cur; return
 233 |             if cur.right is None: cur.right = node; node.parent = cur; return
 234 |     def remove_pos(self, pos):               # O(n): the LAST node fills the gap
 235 |         nodes = self._level_list()
 236 |         target = next((n for n in nodes if n.pos == pos), None)
 237 |         if target is None:
 238 |             return
 239 |         last = nodes[-1]
 240 |         if target is not last:               # copy the last node's data into the target
 241 |             target.name, target.label, target.pos, target.cat = last.name, last.label, last.pos, last.cat
 242 |         p = last.parent
 243 |         if p.right is last: p.right = None
 244 |         else:               p.left = None
 245 |         last.parent = None
 246 | 
 247 | class GardenTree(BinaryTree):
 248 |     """Root = Garden. Every planted crop becomes a node (left/right children)."""
 249 |     def __init__(self):
 250 |         super().__init__(TreeNode("Garden", "🌳"))
 251 |     def add_plant(self, crop, r, c):
 252 |         self.insert(TreeNode("%s(%d,%d)" % (crop.name, r, c), crop.emoji, (r, c), crop.category))
 253 |     def remove_plant(self, r, c):
 254 |         self.remove_pos((r, c))
 255 |     def positions(self):                     # BFS order of plant positions (used by Save)
 256 |         return [list(n.pos) for n in self._level_list() if n.pos is not None]
```
**Key lines to explain**

| Line | What it does |
|---|---|
| 230 | BFS finds the first free slot |
| 234 | last node fills the gap |
| 247 | inheritance |


### 3.6 Tree Traversal (BFS and DFS)

```python
 276 | def bfs(root):                               # Level order, uses a QUEUE, O(n)
 277 |     out, q = [], deque([root])
 278 |     while q:
 279 |         n = q.popleft()
 280 |         out.append(n)
 281 |         if n.left:  q.append(n.left)
 282 |         if n.right: q.append(n.right)
 283 |     return out
 284 | 
 285 | def preorder(n, out=None):                   # Root -> Left -> Right
 286 |     out = [] if out is None else out
 287 |     if n:
 288 |         out.append(n); preorder(n.left, out); preorder(n.right, out)
 289 |     return out
 290 | 
 291 | def inorder(n, out=None):                    # Left -> Root -> Right
 292 |     out = [] if out is None else out
 293 |     if n:
 294 |         inorder(n.left, out); out.append(n); inorder(n.right, out)
 295 |     return out
 296 | 
 297 | def postorder(n, out=None):                  # Left -> Right -> Root
 298 |     out = [] if out is None else out
 299 |     if n:
 300 |         postorder(n.left, out); postorder(n.right, out); out.append(n)
 301 |     return out
```
The game uses them: `act_harvest_all` and `_step` use inorder, `act_prune` uses postorder (children first).

### 3.7 Binary Search Tree and Node Mutation
Key = tile number `row * SIZE + col`. Rule: left < node < right. Delete has 3 cases; case 3 copies the inorder successor into the node (**node mutation**).

```python
 337 | class BSTNode:
 338 |     _next_id = 0
 339 |     def __init__(self, val, name=None, cat="Garden", plant=None):
 340 |         BSTNode._next_id += 1
 341 |         self.id = BSTNode._next_id
 342 |         self.val = val                       # BST key = tile number (row * SIZE + col)
 343 |         self.name, self.cat = name or str(val), cat
 344 |         self.plant = plant                   # the SAME Plant object that is in the grid cell
 345 |         self.height = 1                      # used by the AVL tree (a leaf has height 1)
 346 |         self.stage, self.health, self.mutation = "Seedling", "Healthy", None
 347 |         self.left = self.right = None
 348 | 
 349 |     def refresh(self):                       # NODE MUTATION: update this node IN PLACE from its plant
 350 |         if self.plant:
 351 |             self.stage = self.plant.stage_name()
 352 |             self.health = self.plant.health
 353 |             self.mutation = self.plant.mutation
 354 | 
 355 |     def copy_from(self, other):              # NODE MUTATION: overwrite this node's data in place
 356 |         self.val, self.name, self.cat, self.plant = other.val, other.name, other.cat, other.plant
 357 |         self.stage, self.health, self.mutation = other.stage, other.health, other.mutation
 358 | 
 359 |     def to_dict(self):
 360 |         return {"id": self.id, "label": str(self.val), "name": self.name, "cat": self.cat,
 361 |                 "stage": self.stage, "health": self.health, "mutation": self.mutation,
 362 |                 "bf": bst_height(self.right) - bst_height(self.left),   # balance factor shown in the lab
 363 |                 "left": self.left.to_dict() if self.left else None,
 364 |                 "right": self.right.to_dict() if self.right else None}
```
```python
 372 | class BST:
 373 |     """Rule: left values < node value < right values. No duplicates."""
 374 |     def __init__(self):
 375 |         self.root = None
 376 | 
 377 |     def insert(self, val, name=None, cat="Garden", plant=None):   # avg O(log n), worst O(n)
 378 |         if self.search(val)[0] is not None:
 379 |             return False                                     # duplicate -> reject
 380 |         node = BSTNode(val, name, cat, plant)
 381 |         node.refresh()
 382 |         self.root = self._insert(self.root, node)
 383 |         return True
 384 | 
 385 |     def _insert(self, root, node):                           # recursive insert
 386 |         if root is None:
 387 |             return node                                      # empty spot found
 388 |         if node.val < root.val:
 389 |             root.left = self._insert(root.left, node)        # smaller -> go left
 390 |         else:
 391 |             root.right = self._insert(root.right, node)      # bigger -> go right
 392 |         return root
 393 | 
 394 |     def search(self, val):                                   # avg O(log n), worst O(n)
 395 |         path = []                                            # remember the steps for the animation
 396 |         return self._search(self.root, val, path), path
 397 | 
 398 |     def _search(self, root, val, path):                      # recursive search
 399 |         if root is None:
 400 |             return None
 401 |         path.append(root.id)
 402 |         if root.val == val:
 403 |             return root
 404 |         if val < root.val:
 405 |             return self._search(root.left, val, path)
 406 |         return self._search(root.right, val, path)
 407 | 
 408 |     def delete(self, val):                                   # avg O(log n), worst O(n)
 409 |         if self.search(val)[0] is None:
 410 |             return False                                     # value is not in the tree
 411 |         self.root = self._delete(self.root, val)
 412 |         return True
 413 | 
 414 |     def _delete(self, root, val):                            # recursive delete (3 cases)
 415 |         if root is None:
 416 |             return root
 417 |         if val < root.val:
 418 |             root.left = self._delete(root.left, val)
 419 |         elif val > root.val:
 420 |             root.right = self._delete(root.right, val)
 421 |         else:                                                # found the node to delete
 422 |             if root.left is None:                            # case 1 (leaf) or case 2 (one child)
 423 |                 return root.right
 424 |             elif root.right is None:                         # case 2 (one child)
 425 |                 return root.left
 426 |             temp = find_min(root.right)                      # case 3: inorder successor
 427 |             root.copy_from(temp)                             # NODE MUTATION: copy its data here
 428 |             root.right = self._delete(root.right, temp.val)  # then remove the successor node
 429 |         return root
```
**Key lines to explain**

| Line | What it does |
|---|---|
| 385 | recursive insert |
| 414 | 3 cases |
| 426 | case 3: inorder successor |
| 427 | node mutation: copy the successor's data |
| 349 | node follows its plant every tick |


### 3.8 AVL Tree
**What it is:** an AVL tree is a BST that balances itself. After every insert or delete, the heights and **balance factors** of all ancestors are recalculated ("retracing", done by recursion on the way back up). If a balance factor is below -1 or above 1, a **rotation** fixes it. Search, insert and delete stay **O(log n)** because the height is kept small; an unbalanced BST can become a chain with O(n).

| Case | Meaning | Fix |
|---|---|---|
| Left-Left | node and its left child are left heavy | right rotation |
| Right-Right | node and its right child are right heavy | left rotation |
| Left-Right | node left heavy, left child right heavy | left rotation on the child, then right rotation |
| Right-Left | node right heavy, right child left heavy | right rotation on the child, then left rotation |

*Note:* BF = height(right) - height(left), so a positive value means right heavy and a negative value means left heavy. Some books use left minus right; only the sign flips, and the rule |BF| > 1 is the same either way.

**In the game:** `Game.bst` is now an `AVLTree`, so planting tiles 0, 1, 2, 3... in order does not make a chain. The DSA Lab has an **AVL demo** button: the same sorted inserts that make a skewed BST are balanced by rotations.

```python
 466 | def get_height(node):                        # empty = 0, leaf = 1
 467 |     return node.height if node else 0
 468 | 
 469 | def get_balance(node):                       # balance factor = height(right) - height(left)
 470 |     return get_height(node.right) - get_height(node.left) if node else 0
 471 | 
 472 | def update_height(node):
 473 |     node.height = 1 + max(get_height(node.left), get_height(node.right))
 474 | 
 475 | def right_rotate(y, log):                    # y is left-heavy: its left child x becomes the parent
 476 |     x = y.left
 477 |     t2 = x.right
 478 |     x.right = y
 479 |     y.left = t2
 480 |     update_height(y)                         # y is lower now, so update y first
 481 |     update_height(x)
 482 |     log.append("Right rotation on %s" % y.val)
 483 |     return x                                 # x is the new root of this subtree
 484 | 
 485 | def left_rotate(x, log):                     # x is right-heavy: its right child y becomes the parent
 486 |     y = x.right
 487 |     t2 = y.left
 488 |     y.left = x
 489 |     x.right = t2
 490 |     update_height(x)
 491 |     update_height(y)
 492 |     log.append("Left rotation on %s" % x.val)
 493 |     return y
 494 | 
 495 | class AVLTree(BST):
 496 |     """Same insert/search/delete as BST, but every ancestor is re-checked on the way back up (retracing)."""
 497 |     def __init__(self):
 498 |         super().__init__()
 499 |         self.log = []                        # rotations done by the last insert/delete
 500 | 
 501 |     def insert(self, val, name=None, cat="Garden", plant=None):
 502 |         self.log = []
 503 |         return super().insert(val, name, cat, plant)
 504 | 
 505 |     def delete(self, val):
 506 |         self.log = []
 507 |         return super().delete(val)
 508 | 
 509 |     def _insert(self, root, node):
 510 |         if root is None:
 511 |             return node
 512 |         if node.val < root.val:
 513 |             root.left = self._insert(root.left, node)
 514 |         else:
 515 |             root.right = self._insert(root.right, node)
 516 |         return self._rebalance(root)         # RETRACING: runs for every ancestor after the recursive call
 517 | 
 518 |     def _delete(self, root, val):
 519 |         if root is None:
 520 |             return root
 521 |         if val < root.val:
 522 |             root.left = self._delete(root.left, val)
 523 |         elif val > root.val:
 524 |             root.right = self._delete(root.right, val)
 525 |         else:
 526 |             if root.left is None:
 527 |                 return root.right
 528 |             elif root.right is None:
 529 |                 return root.left
 530 |             temp = find_min(root.right)      # same 3 cases as the BST
 531 |             root.copy_from(temp)             # NODE MUTATION
 532 |             root.right = self._delete(root.right, temp.val)
 533 |         return self._rebalance(root)
 534 | 
 535 |     def _rebalance(self, node):
 536 |         update_height(node)
 537 |         bal = get_balance(node)
 538 |         if bal < -1 and get_balance(node.left) <= 0:     # Left-Left: one right rotation
 539 |             return right_rotate(node, self.log)
 540 |         if bal < -1 and get_balance(node.left) > 0:      # Left-Right: left on child, then right
 541 |             node.left = left_rotate(node.left, self.log)
 542 |             return right_rotate(node, self.log)
 543 |         if bal > 1 and get_balance(node.right) >= 0:      # Right-Right: one left rotation
 544 |             return left_rotate(node, self.log)
 545 |         if bal > 1 and get_balance(node.right) < 0:       # Right-Left: right on child, then left
 546 |             node.right = right_rotate(node.right, self.log)
 547 |             return left_rotate(node, self.log)
 548 |         return node
 549 | 
 550 |     def rebuild_balanced(self):              # nothing to do: an AVL tree is always balanced
 551 |         pass
```
**Key lines to explain**

| Line | What it does |
|---|---|
| 469 | balance factor = right height - left height (positive = right heavy) |
| 475 | Left-Left fix; the middle subtree changes parent |
| 485 | Right-Right fix |
| 516 | RETRACING: runs for every ancestor after the recursive call |
| 535 | checks the four cases and rotates |
| 427 | AVL delete still uses the BST 3 cases (node mutation) |

Why `tree_shape` is saved: after rotations the shape depends on insert order, so Save stores the exact shape instead of re-inserting.

### 3.9 Sorting Algorithms (study notes)
*(Complexities are the standard values; the comparison counts below were measured by running my own code.)*

**Explanations in my own words**

1. **Bubble Sort:** it walks through the list and swaps any two neighbors that are in the wrong order. After each pass the biggest unsorted value "bubbles" to the end, so the list shrinks until a full pass makes no swaps.
2. **Insertion Sort:** it keeps the left part of the list sorted. It takes the next value and shifts the bigger sorted values to the right until the right spot is found, like arranging playing cards in your hand.
3. **Selection Sort:** it finds the smallest value in the unsorted part and swaps it to the front of that part. This repeats, so the sorted part grows one value at a time from the left.
4. **Quick Sort:** it picks a pivot (my code uses the last item) and moves smaller values to its left and bigger ones to its right, so the pivot lands in its final place. Then it does the same on the left and right parts using recursion.
5. **Merge Sort:** it splits the list in halves until each piece has one item, then merges the pieces back, always taking the smaller front item first. Each merge gives a bigger sorted list.

**Summary table**

| Algorithm | Best | Average | Worst | Space | Stable? |
|---|---|---|---|---|---|
| Bubble Sort | O(n) (with early exit) | O(n^2) | O(n^2) | O(1) | Yes |
| Insertion Sort | O(n) | O(n^2) | O(n^2) | O(1) | Yes |
| Selection Sort | O(n^2) | O(n^2) | O(n^2) | O(1) | No |
| Quick Sort | O(n log n) | O(n log n) | O(n^2) | O(log n) (recursion) | No |
| Merge Sort | O(n log n) | O(n log n) | O(n log n) | O(n) | Yes |

**What I measured with my own code (comparisons counted; a random list of 40 different numbers from 1 to 99, seed 7):** Bubble 735, Selection 780, Insertion 348, Quick 176, Merge 168. On an **already sorted** list of 40: Bubble 39 and Insertion 39 (best case O(n)), Merge 116, but Selection 780 and Quick Sort 780 (its worst case, because the pivot is always the biggest item, so n(n-1)/2 comparisons). This matches the table.

```python
 660 | def _before(x, y, reverse):                  # should x come BEFORE y?  (strict, so equal items keep their order)
 661 |     return x > y if reverse else x < y
 662 | 
 663 | def _snap(rec, a):
 664 |     if rec is not None and len(rec) < 600:
 665 |         rec.append(list(a))
 666 | 
 667 | def bubble_sort(items, key=lambda x: x, reverse=False, rec=None):
 668 |     a, comps = list(items), 0
 669 |     for i in range(len(a) - 1):              # after pass i the biggest i+1 items are in place
 670 |         swapped = False
 671 |         for j in range(len(a) - 1 - i):
 672 |             comps += 1
 673 |             if _before(key(a[j + 1]), key(a[j]), reverse):   # neighbors in the wrong order
 674 |                 a[j], a[j + 1] = a[j + 1], a[j]
 675 |                 swapped = True
 676 |                 _snap(rec, a)
 677 |         if not swapped:                      # no swap in a full pass = already sorted (best case O(n))
 678 |             break
 679 |     return a, comps
 680 | 
 681 | def insertion_sort(items, key=lambda x: x, reverse=False, rec=None):
 682 |     a, comps = list(items), 0
 683 |     for i in range(1, len(a)):               # a[0:i] is already sorted
 684 |         cur, j = a[i], i - 1
 685 |         while j >= 0:
 686 |             comps += 1
 687 |             if _before(key(cur), key(a[j]), reverse):
 688 |                 a[j + 1] = a[j]              # shift the bigger item to the right
 689 |                 j -= 1
 690 |             else:
 691 |                 break
 692 |         a[j + 1] = cur                       # drop the item into its gap
 693 |         _snap(rec, a)
 694 |     return a, comps
 695 | 
 696 | def selection_sort(items, key=lambda x: x, reverse=False, rec=None):
 697 |     a, comps = list(items), 0
 698 |     for i in range(len(a) - 1):
 699 |         best = i                             # index of the smallest (or biggest) item in a[i:]
 700 |         for j in range(i + 1, len(a)):
 701 |             comps += 1
 702 |             if _before(key(a[j]), key(a[best]), reverse):
 703 |                 best = j
 704 |         if best != i:
 705 |             a[i], a[best] = a[best], a[i]
 706 |             _snap(rec, a)
 707 |     return a, comps
 708 | 
 709 | def quick_sort(items, key=lambda x: x, reverse=False, rec=None):
 710 |     a, comps = list(items), [0]
 711 |     def sort(lo, hi):
 712 |         if lo >= hi:
 713 |             return
 714 |         pivot, i = key(a[hi]), lo            # pivot = last item
 715 |         for j in range(lo, hi):
 716 |             comps[0] += 1
 717 |             if _before(key(a[j]), pivot, reverse):
 718 |                 a[i], a[j] = a[j], a[i]      # move items that belong before the pivot to the left side
 719 |                 i += 1
 720 |         a[i], a[hi] = a[hi], a[i]            # pivot goes to its final place
 721 |         _snap(rec, a)
 722 |         sort(lo, i - 1)                      # sort the left part
 723 |         sort(i + 1, hi)                      # sort the right part
 724 |     sort(0, len(a) - 1)
 725 |     return a, comps[0]
 726 | 
 727 | def merge_sort(items, key=lambda x: x, reverse=False, rec=None):
 728 |     a, comps = list(items), [0]
 729 |     def sort(lo, hi):                        # sorts a[lo..hi]
 730 |         if lo >= hi:
 731 |             return
 732 |         mid = (lo + hi) // 2
 733 |         sort(lo, mid)                        # divide
 734 |         sort(mid + 1, hi)
 735 |         left, right = a[lo:mid + 1], a[mid + 1:hi + 1]
 736 |         i = j = 0
 737 |         k = lo
 738 |         while i < len(left) and j < len(right):          # merge two sorted halves
 739 |             comps[0] += 1
 740 |             if _before(key(right[j]), key(left[i]), reverse):
 741 |                 a[k] = right[j]; j += 1
 742 |             else:
 743 |                 a[k] = left[i]; i += 1       # ties take the LEFT item first = stable
 744 |             k += 1
 745 |         while i < len(left):
 746 |             a[k] = left[i]; i += 1; k += 1
 747 |         while j < len(right):
 748 |             a[k] = right[j]; j += 1; k += 1
 749 |         _snap(rec, a)
 750 |     sort(0, len(a) - 1)
 751 |     return a, comps[0]
```
**Key lines to explain**

| Line | What it does |
|---|---|
| 667 | adjacent swaps + early exit (best case O(n)) |
| 681 | shift bigger items right, insert the current item |
| 696 | pick the smallest, swap to the front |
| 709 | pivot + partition + recursion |
| 727 | divide, then merge two sorted halves |
| 660 | strict comparison so equal items keep their order (stable) |


### 3.10 Hash Tables, Collisions and Rehashing (study notes)
**Hash table.** It stores items in an array of buckets. A **hash function** turns a key (like a plant ID) into a bucket number, so we can jump straight to the item instead of checking all items. Average search, insert and delete are O(1). My hash function multiplies the running value by 31 for each character, so the position of a character matters, then uses `% number_of_buckets`.

**Collision.** A collision happens when two different keys get the same bucket number, for example, in a table with 8 buckets, "P001" and "P009" both get bucket 3. A good table must still keep both keys.

**Chaining (separate chaining) vs open addressing**

| | Chaining | Open addressing (linear probing) |
|---|---|---|
| Where does the colliding key go? | In the **same bucket**: each bucket is a list (chain) and the key is added to it | In the **next free slot** (+1, +2, ... wrap around) |
| Items per slot | many | one |
| Search | hash, then check the keys in that chain one by one | hash, then probe slot by slot until the key or an empty slot is found |
| Delete | just remove from the list | must leave a **tombstone**, or later searches would stop too early |
| Load factor | can go above 1 (long chains) | must stay below 1 (table can become full) |
| Weakness | extra memory for lists; long chains are slow | clustering (keys bunch together); needs rehash earlier |

**Rehashing.** Rehashing means creating a **bigger table** and putting every key in again with the new size. It is triggered by the **load factor** = n / m (number of keys / number of buckets). When the load factor passes the limit (my code: more than 0.75 for chaining, more than 0.5 for open addressing) the table doubles its buckets. Every key must be hashed again because the bucket number uses `% size`, which changed. One rehash costs O(n), but it is rare, so the average insert stays O(1). Rehashing also removes tombstones and shortens chains.

```python
 777 | class HashTable:
 778 |     """HASH TABLE with SEPARATE CHAINING: every bucket is a list, so keys that
 779 |     land in the same bucket (a COLLISION) simply share that list."""
 780 |     def __init__(self, size=8, max_load=0.75):
 781 |         self.buckets = [[] for _ in range(size)]      # list of buckets, each bucket = list of [key, value]
 782 |         self.count, self.max_load = 0, max_load
 783 |         self.collisions, self.rehashes = 0, 0
 784 | 
 785 |     def hash(self, key):                              # key -> bucket number
 786 |         h = 0
 787 |         for ch in str(key):
 788 |             h = (h * 31 + ord(ch)) % 1000003          # position matters ("abc" != "cba")
 789 |         return h % len(self.buckets)                  # use the CURRENT size, not a fixed 10
 790 | 
 791 |     def load_factor(self):                            # n / m : items per bucket
 792 |         return self.count / len(self.buckets)
 793 | 
 794 |     def put(self, key, value):                        # average O(1)
 795 |         idx = self.hash(key)
 796 |         for pair in self.buckets[idx]:                # walk the chain
 797 |             if pair[0] == key:
 798 |                 pair[1] = value                       # same key: update only
 799 |                 return {"index": idx, "collision": False, "updated": True, "rehashed": None}
 800 |         collided = len(self.buckets[idx]) > 0         # bucket already has another key
 801 |         if collided:
 802 |             self.collisions += 1
 803 |         self.buckets[idx].append([key, value])        # CHAINING: add to the end of the chain
 804 |         self.count += 1
 805 |         rehashed = self.rehash() if self.load_factor() > self.max_load else None
 806 |         return {"index": idx, "collision": collided, "updated": False, "rehashed": rehashed}
 807 | 
 808 |     def get(self, key):                               # returns (value, bucket, steps)
 809 |         idx = self.hash(key)
 810 |         steps = 0
 811 |         for k, v in self.buckets[idx]:
 812 |             steps += 1
 813 |             if k == key:
 814 |                 return v, idx, steps
 815 |         return None, idx, steps
 816 | 
 817 |     def remove(self, key):
 818 |         idx = self.hash(key)
 819 |         for i, pair in enumerate(self.buckets[idx]):
 820 |             if pair[0] == key:
 821 |                 del self.buckets[idx][i]
 822 |                 self.count -= 1
 823 |                 return True
 824 |         return False
 825 | 
 826 |     def rehash(self):                                 # REHASHING: grow the table and re-place every key
 827 |         old_size = len(self.buckets)
 828 |         old_items = [pair for bucket in self.buckets for pair in bucket]
 829 |         self.buckets = [[] for _ in range(old_size * 2)]   # double the number of buckets
 830 |         for k, v in old_items:                        # the new size gives NEW bucket numbers
 831 |             self.buckets[self.hash(k)].append([k, v])
 832 |         self.rehashes += 1
 833 |         return [old_size, len(self.buckets)]          # O(n), but rare, so average put stays O(1)
 834 | 
 835 |     def to_dict(self):
 836 |         return {"kind": "chain", "size": len(self.buckets), "count": self.count,
 837 |                 "load": round(self.load_factor(), 2), "max_load": self.max_load,
 838 |                 "collisions": self.collisions, "rehashes": self.rehashes,
 839 |                 "max_chain": max(len(b) for b in self.buckets),
 840 |                 "slots": [[p[0] for p in b] for b in self.buckets]}
```
**Key lines to explain**

| Line | What it does |
|---|---|
| 785 | key to bucket number |
| 800 | collision = the bucket already has a key |
| 803 | CHAINING: add to the chain |
| 791 | n / m |
| 805 | rehash trigger |
| 826 | double the buckets and re-place every key |

```python
 842 | class OpenAddressTable:
 843 |     """HASH TABLE with OPEN ADDRESSING (linear probing): one key per slot.
 844 |     If the slot is taken, look at the NEXT slot (wrap around) until a free one is found."""
 845 |     DELETED = "<deleted>"                             # tombstone so searches do not stop too early
 846 |     def __init__(self, size=8, max_load=0.5):
 847 |         self.slots = [None] * size                    # None = empty, DELETED = tombstone, else [key, value]
 848 |         self.count, self.used, self.max_load = 0, 0, max_load   # used = live keys + tombstones
 849 |         self.collisions, self.rehashes = 0, 0
 850 | 
 851 |     def hash(self, key):
 852 |         h = 0
 853 |         for ch in str(key):
 854 |             h = (h * 31 + ord(ch)) % 1000003
 855 |         return h % len(self.slots)
 856 | 
 857 |     def load_factor(self):
 858 |         return self.used / len(self.slots)
 859 | 
 860 |     def put(self, key, value):
 861 |         start = self.hash(key)
 862 |         first_free = None                             # first tombstone we pass (can be reused)
 863 |         for step in range(len(self.slots)):
 864 |             i = (start + step) % len(self.slots)      # linear probing: +1 each time
 865 |             s = self.slots[i]
 866 |             if s is None:                             # empty slot: the key is not in the table
 867 |                 target, probes = (first_free if first_free is not None else i), step + 1
 868 |                 break
 869 |             if s is self.DELETED:
 870 |                 if first_free is None:
 871 |                     first_free = i
 872 |             elif s[0] == key:
 873 |                 s[1] = value
 874 |                 return {"index": i, "collision": False, "updated": True, "probes": step + 1, "rehashed": None}
 875 |         else:                                         # no empty slot at all
 876 |             target, probes = first_free, len(self.slots)
 877 |         collided = target != start
 878 |         if collided:
 879 |             self.collisions += 1
 880 |         if self.slots[target] is None:
 881 |             self.used += 1
 882 |         self.slots[target] = [key, value]
 883 |         self.count += 1
 884 |         rehashed = self.rehash() if self.load_factor() > self.max_load else None
 885 |         return {"index": target, "collision": collided, "updated": False, "probes": probes, "rehashed": rehashed}
 886 | 
 887 |     def get(self, key):                               # returns (value, slot, probes)
 888 |         start = self.hash(key)
 889 |         for step in range(len(self.slots)):
 890 |             i = (start + step) % len(self.slots)
 891 |             s = self.slots[i]
 892 |             if s is None:
 893 |                 return None, i, step + 1
 894 |             if s is not self.DELETED and s[0] == key:
 895 |                 return s[1], i, step + 1
 896 |         return None, start, len(self.slots)
 897 | 
 898 |     def remove(self, key):
 899 |         start = self.hash(key)
 900 |         for step in range(len(self.slots)):
 901 |             i = (start + step) % len(self.slots)
 902 |             s = self.slots[i]
 903 |             if s is None:
 904 |                 return False
 905 |             if s is not self.DELETED and s[0] == key:
 906 |                 self.slots[i] = self.DELETED          # tombstone, NOT None
 907 |                 self.count -= 1
 908 |                 return True
 909 |         return False
 910 | 
 911 |     def rehash(self):
 912 |         old_size = len(self.slots)
 913 |         old_items = [s for s in self.slots if s is not None and s is not self.DELETED]
 914 |         self.slots = [None] * (old_size * 2)
 915 |         self.count = self.used = 0
 916 |         for k, v in old_items:                        # tombstones disappear here
 917 |             i = self.hash(k)
 918 |             while self.slots[i] is not None:
 919 |                 i = (i + 1) % len(self.slots)
 920 |             self.slots[i] = [k, v]
 921 |             self.count += 1
 922 |             self.used += 1
 923 |         self.rehashes += 1
 924 |         return [old_size, len(self.slots)]
 925 | 
 926 |     def to_dict(self):
 927 |         return {"kind": "open", "size": len(self.slots), "count": self.count,
 928 |                 "load": round(self.load_factor(), 2), "max_load": self.max_load,
 929 |                 "collisions": self.collisions, "rehashes": self.rehashes, "max_chain": 0,
 930 |                 "slots": [None if s is None else ("x" if s is self.DELETED else s[0]) for s in self.slots]}
```
**Key lines to explain**

| Line | What it does |
|---|---|
| 845 | tombstone marker |
| 864 | linear probing, wraps around |
| 906 | delete leaves a tombstone |
| 916 | rehash cleans tombstones |


```python
1056 |         plant.uid = "P%03d" % self.next_uid      # unique ID
1057 |         self.next_uid += 1
1058 |         roll = random.random()                   # small chance of a lucky mutation
1059 |         if roll < 0.004: plant.set_mutation("Rainbow")
1060 |         elif roll < 0.03: plant.set_mutation("Gold")
1061 |         self.grid.place(r, c, plant)             # 2D list
1062 |         self.tree.add_plant(crop, r, c)          # hierarchical tree
1063 |         self.bst.insert(self.key(r, c), "%s(%d,%d)" % (crop.name, r, c), crop.category, plant)  # BST
1064 |         self.history.push({"r": r, "c": c, "crop": name})   # stack
1065 |         info = self.registry.put(plant.uid, [r, c])         # hash table (may rehash)
1066 |         if info["rehashed"]:
1067 |             self.say("toast", text="🔁 Hash table rehashed: %d → %d buckets (load factor passed %.2f)" % (
1068 |                 info["rehashed"][0], info["rehashed"][1], self.registry.max_load))
```
```python
 992 |         self.registry = HashTable(8)             # HASH TABLE: plant ID -> [row, col]
```

### 3.11 Using Sorting and Hash Tables in the Garden Simulator
**Crop inventory and leaderboard sorting.** I chose **two** of the sorting algorithms from Section 3.9:

| Algorithm | Used for | Why this one |
|---|---|---|
| **Insertion Sort** (basic) | (a) Sorting the harvested crops in the **Basket** by weight, value, name or mutation | The basket is small (max 40) and new fruit is added at the end, so the list is often *almost sorted*. Insertion Sort is O(n) on almost sorted data, is stable and uses O(1) extra space |
| **Merge Sort** (advanced) | (b) The **harvest leaderboard** (player vs neighbors, ranked by score) and the **Shop** list (by cost, value, level) | Always O(n log n), even in the worst case, and **stable**: players with the same score keep their order, and shop items with the same price keep their level order. Quick Sort would be O(n^2) with a bad pivot |

(c) Code of the two functions and where the game calls them (line numbers are in `js/templates.js`). Pseudocode of the basket sort:

```
sort_basket(basket, key, reverse):
    a = copy of basket
    for i from 1 to length(a) - 1:
        cur = a[i]; j = i - 1
        while j >= 0 and cur should come before a[j]:
            a[j + 1] = a[j]          # shift the bigger item to the right
            j = j - 1
        a[j + 1] = cur               # drop cur into the gap
    return a
```

```python
 681 | def insertion_sort(items, key=lambda x: x, reverse=False, rec=None):
 682 |     a, comps = list(items), 0
 683 |     for i in range(1, len(a)):               # a[0:i] is already sorted
 684 |         cur, j = a[i], i - 1
 685 |         while j >= 0:
 686 |             comps += 1
 687 |             if _before(key(cur), key(a[j]), reverse):
 688 |                 a[j + 1] = a[j]              # shift the bigger item to the right
 689 |                 j -= 1
 690 |             else:
 691 |                 break
 692 |         a[j + 1] = cur                       # drop the item into its gap
 693 |         _snap(rec, a)
 694 |     return a, comps
 695 | 
 696 | def selection_sort(items, key=lambda x: x, reverse=False, rec=None):
 697 |     a, comps = list(items), 0
```
```python
 727 | def merge_sort(items, key=lambda x: x, reverse=False, rec=None):
 728 |     a, comps = list(items), [0]
 729 |     def sort(lo, hi):                        # sorts a[lo..hi]
 730 |         if lo >= hi:
 731 |             return
 732 |         mid = (lo + hi) // 2
 733 |         sort(lo, mid)                        # divide
 734 |         sort(mid + 1, hi)
 735 |         left, right = a[lo:mid + 1], a[mid + 1:hi + 1]
 736 |         i = j = 0
 737 |         k = lo
 738 |         while i < len(left) and j < len(right):          # merge two sorted halves
 739 |             comps[0] += 1
 740 |             if _before(key(right[j]), key(left[i]), reverse):
 741 |                 a[k] = right[j]; j += 1
 742 |             else:
 743 |                 a[k] = left[i]; i += 1       # ties take the LEFT item first = stable
 744 |             k += 1
 745 |         while i < len(left):
 746 |             a[k] = left[i]; i += 1; k += 1
 747 |         while j < len(right):
```
**Where the game calls them**

```python
1171 |     def act_sort_basket(self, by="weight", desc=True):   # INSERTION SORT: small list, often almost sorted
1172 |         if by not in BASKET_KEYS: return "Unknown sort."
1173 |         if len(self.res.basket) < 2: return "Not enough fruit in the basket to sort."
1174 |         self.res.basket, comps = insertion_sort(self.res.basket, key=BASKET_KEYS[by], reverse=desc)
1175 |         self.basket_note = "Insertion sort by %s (%s): %d comparisons for %d fruits" % (
1176 |             by, "high to low" if desc else "low to high", comps, len(self.res.basket))
```
```python
1188 |     def leaderboard(self):                       # MERGE SORT: stable, always O(n log n)
1189 |         rows = [{"name": "You", "face": "🌱", "score": self.score(), "me": True}]
1190 |         for i, (name, face, rate) in enumerate(FARMERS):
1191 |             rows.append({"name": name, "face": face, "score": int(20 * (i + 1) + rate * self.clock / 3), "me": False})
1192 |         ranked, comps = merge_sort(rows, key=lambda r: r["score"], reverse=True)
1193 |         for i, r in enumerate(ranked):
1194 |             r["rank"] = i + 1
```
**Fast plant lookup and collision handling (hash table).** Every plant gets a unique ID (`P001`, `P002`, ...). The game keeps a **hash table** `registry` that maps *plant ID -> [row, col]* (the plot), so the game can find a plant's data from its ID without scanning the 36 plots. The table is a list of buckets; the hash function turns the ID into a bucket number with `% number_of_buckets`.

- **Collision technique: Chaining (separate chaining).** When two IDs land in the same bucket, both stay in that bucket's list. I chose chaining because plants are added and **harvested (deleted) all the time**: chaining deletes by simply removing from a list, while open addressing needs tombstones. Chains stay short because the table grows.
- **Rehashing prevents lag when the garden grows.** The table starts with 8 buckets. After each insert the game checks the **load factor** = plants / buckets. If it is more than **0.75**, the table **doubles** (8 -> 16 -> 32) and every ID is hashed again with the new size. In the game the toast "Hash table rehashed" appears at plant 7, 13 and 25. Without rehashing, a bigger garden (more plants than buckets) would make every chain longer and every lookup slower, so the game would lag. One rehash costs O(n), but it is rare, so the average insert stays O(1) and lookups stay fast even if the player expands the grid.

```python
1065 |         info = self.registry.put(plant.uid, [r, c])         # hash table (may rehash)
1066 |         if info["rehashed"]:
1067 |             self.say("toast", text="🔁 Hash table rehashed: %d → %d buckets (load factor passed %.2f)" % (
1068 |                 info["rehashed"][0], info["rehashed"][1], self.registry.max_load))
```
```python
1165 |         _, bucket, steps = self.registry.get(p.uid)         # hash table lookup by plant ID
```

### 3.12 Where to see it in the game
- **Python OOP:** the whole game; the **Code Editor** tab shows every class and lets you edit and run it.
- **2D list:** the 6x6 field on the Garden tab (click a tile to plant, water or harvest).
- **Stack:** Action History panel and the **Undo** button (hotkey U).
- **Queue:** Weather Queue panel (the first forecast happens first) and the Orders tab (serve the front neighbor first).
- **Hierarchical Tree:** DSA Lab tab, Hierarchical Tree card (root Garden, each plant is a node).
- **BFS and DFS:** DSA Lab, buttons BFS, Preorder, Inorder, Postorder; Prune Dead on the Garden tab uses postorder.
- **Binary Search Tree and Node Mutation:** Plant Inspector (BST search steps), DSA Lab Binary Search Tree card (insert, search, delete, skew, rebuild); plants change stage and health in place.
- **AVL Tree:** DSA Lab, AVL demo button (the same sorted inserts balanced by rotations); the garden tree itself is an AVL tree.
- **Sorting:** Basket tab (Insertion Sort), Board and Shop (Merge Sort), DSA Lab Sorting Lab (all five algorithms).
- **Hash Tables:** plant ID registry (the "Hash table rehashed" message appears at plants 7, 13 and 25), DSA Lab Hash Table Lab (chaining vs open addressing).

## 4. Complexity Summary

| Operation | Structure | Time |
|---|---|---|
| Read / write a tile | 2D list | O(1) |
| Push / pop (Undo) | list stack | O(1) |
| Enqueue / dequeue | `deque` | O(1) |
| Insert / search / delete in a plain BST | BST | O(h): O(log n) balanced, O(n) skewed |
| Find / add / remove a plant by tile | AVL tree | **O(log n) guaranteed** (BST alone: O(n) worst) |
| Find a plant by plant ID | hash table (chaining) | O(1) average, O(n) worst if all keys collide |
| Rehash | hash table | O(n), rare |
| Sort basket | Insertion Sort | O(n) almost sorted, O(n^2) worst |
| Leaderboard | Merge Sort | O(n log n) always |
| BFS, DFS | tree | O(n) |

## 5. Testing and Demonstration
I tested every topic with automated checks that run the same Python code as the game (random stress tests in CPython) and with a browser test (Google Chrome engine + Pyodide + Tailwind) that clicks through the real game. I also play-tested the game myself in Google Chrome, opened with the VS Code Live Server.

| Topic | What was checked | Result |
|---|---|---|
| Python OOP | Resources never go below 0 or above their maximum; seeds and basket stay valid after every random action | Passed |
| 2D list | After every action, the occupied tiles of the field match the plants in the trees and the hash registry (40 random games x 600 actions) | Passed |
| Stack | Every planting is pushed; Undo pops it and gives the seed back; random Undo during the stress test never breaks the other structures | Passed |
| Queue | The forecast queue always keeps at least 4 weather events (first in, first out); the order queue never goes over 4 neighbors; browser test sees both queues | Passed |
| Hierarchical Tree | Tree size and node positions always equal the planted tiles | Passed |
| BFS / DFS | The example tree A to F gives the expected BFS, preorder, inorder and postorder results; after Prune Dead (postorder) all structures still agree | Passed |
| BST | Inorder is always strictly sorted; BST rule holds for every node; delete works for leaf, one child and two children (root deletion copies the inorder successor) | Passed |
| Node Mutation | A plant and its tree node always share the same data; growing, getting sick and dying never break the other structures | Passed |
| AVL Tree | Balance factor stays between -1 and 1 after every action; rotations LL, RR, LR and RL give the expected roots; inserting C, B, E, A, D, H, G, F gives inorder A..H with height 3; 127 sorted inserts give height 6 (a plain BST would be 126) | Passed |
| Sorting | All five algorithms match Python's `sorted` (1500 random lists with duplicates, ascending and descending); stable ones keep equal items in order | 0 failures |
| Hash Tables | 300 random runs x 120 operations of both tables against a Python dictionary, including rehash and tombstones; registry count and values always match the plants | 0 failures |
| Save and load | Save then Load rebuilds the same BST/AVL and tree shape; refresh in the browser keeps the game and your edited code | Passed |

**Browser test:** 54 of 54 checks passed with no console errors (planting, Undo, shop, sell, orders, quests, inspect, weather, DSA Lab traversals and BST operations, AVL demo, Sorting Lab, Hash Table Lab, Code Editor edits, refresh persistence, win screen and phone layout).

**Limits:** tested in Google Chrome (opened with VS Code Live Server); the balance of the game was not long-playtested.

**Demo:** Garden tab: buy seeds, plant 7 or more crops (watch the rehash message), use Undo, harvest, then Basket > sort. DSA Lab: run each traversal, insert/search/delete in the BST, press AVL demo, run the Sorting Lab for each algorithm, then Hash Table Lab > "Insert 8 crop names".

## 6. Approved Technical Environment
HTML5/DOM, Tailwind CSS (CDN), Lucide Icons (CDN), Pyodide 0.26.1 and Vanilla JavaScript only. Game and code are saved in `localStorage`. Sound effects and the relaxing background music are generated with the browser's built-in WebAudio API (no audio files and no extra library); the music has an on/off button and the rain and wind sounds follow the weather.

## 7. Project Version and Git Development
Version: v1.0.0, tagged as the final release (see the Prompt Log and Semantic Versioning file). GitHub repository: https://github.com/j4k3lm/DSA_GardenSimulator.git 

## 8. AI Reflection
- **How I used AI:** I described my project, the data structures I needed and the requirements, and asked the AI step by step for each version (the prompts are in the Prompt Log). It wrote most of the code and notes; I decided what the game should be and checked that every topic (OOP, Stack, Queue, 2D list, Hierarchical Tree, BFS/DFS, BST and node mutation, AVL, Sorting, Hash Tables) is used by the real gameplay.
- **What I learned:** how classes organize a program (OOP); when to use a stack (undo) and a queue (weather, orders); how a 2D list stores a grid; how trees, BFS and DFS visit data; how a BST searches, inserts and deletes and why mutating a node in place is useful; why balancing matters (a BST can become a chain, AVL rotations keep the height at O(log n)); why Merge Sort is stable and always O(n log n) while Insertion Sort suits a small, nearly sorted basket; and how chaining, open addressing and rehashing keep a hash table fast.
- **How the work was verified:** the Python engine was tested with random stress tests (sorting against Python's `sorted`, hash tables against a dictionary, AVL balance after every action) and a browser test (54 of 54 checks). All code lines quoted in this journal were compared with `js/templates.js` and match. Numbers in the notes (comparison counts, rehash points, rotations) were measured by running the code.
- **Honest notes:** the AI wrote most of the code, so for recitation I must explain each line and its Big O in my own words. Best-case and space complexities are the standard values.

## 9. Current Limitations and Next Steps
- The field is 6x6, so Big O differences are tiny in practice; the labs make them visible.
- The hash table registry is used for lookup by plant ID; the BST/AVL is used for lookup by tile number.
- Next: bigger map unlock, regrowing crops, deleting from the open addressing table in the game.

## 10. Submission Summary
**Project:** Python-Based Garden Simulator (v1.0.0), a real-time browser farming game. All game rules are written in Python and run in the browser with Pyodide; JavaScript and HTML only draw the screen. The game and the code you edit are saved in `localStorage`, so they survive a page refresh.

**Data structures and where they are used:**
- **Python OOP:** `Crop`, `ResourceStorage`, `Plant`, `GardenGrid`, `GardenTree`, `BST`, `AVLTree`, `HashTable`, `OpenAddressTable`, `Game`.
- **2D list:** the 6x6 field (`GardenGrid.cells[row][col]`). **Stack:** action history and Undo. **Queue:** weather forecast and neighbor orders (`deque`).
- **Hierarchical Tree + BFS/DFS:** the garden tree; BFS, preorder, inorder and postorder traversals (postorder powers Prune Dead).
- **BST + Node Mutation:** insert, search and delete (3 cases) by tile; plant stage and health change in place.
- **AVL Tree:** the garden index balances itself with LL, RR, LR and RL rotations.
- **Sorting:** all five algorithms in the Sorting Lab; Insertion Sort for the Basket and Merge Sort for the Leaderboard and Shop.
- **Hash Tables:** plant ID registry with chaining and rehashing (8 to 16 buckets at the 7th plant); the Hash Table Lab compares chaining with open addressing.

**Documents submitted:** this Technical Journal, the Prompt Log and Semantic Versioning file, and the two weekly submissions (Hash Tables, Collisions and Rehashing; Sorting Algorithms). **Run:** open the folder in VS Code and use Live Server on `index.html`. **Testing:** stress tests (0 failures) and 54 of 54 browser checks. **Limitations:** tested in Google Chrome only; the field is small, so the labs show the Big O differences.

## 11. Screenshots
All screenshots were taken from the running game (v1.0.0). The same image files are in `docs/screenshots/`. Stack = Undo history (Figure 3), Queue = weather forecast and orders (Figures 3 and 7), 2D list = the field (Figure 2), Python OOP = the whole game and the Code Editor (Figures 36 and 37).

### A. The game (resources, field, shop, basket, orders, quests, board, weather)

**Figure 1. New game: resources, weather queue, 6x6 field, hotbar, shop**

![](screenshots/01_game_start.png){width=6.5in}

**Figure 2. Playing: 14 plants of 11 crop types growing on the 2D list field (some ripe)**

![](screenshots/02_game_playing.png){width=6.5in}

**Figure 3. Weather Queue (FIFO) and Action History (Stack) with the Undo button**

![](screenshots/03_queue_and_stack.png){width=2.6in}

**Figure 4. Plant Inspector: finds the plant with BST search and shows the steps**

![](screenshots/04_plant_inspector.png){width=2.6in}

**Figure 5. Seed Shop (restocks, sorted with Merge Sort)**

![](screenshots/05_shop.png){width=2.6in}

**Figure 6. Basket sorted by weight with Insertion Sort (comparison count shown)**

![](screenshots/06_basket.png){width=3.0in}

**Figure 7. Neighbor orders = Queue (serve the front first)**

![](screenshots/07_orders.png){width=3.0in}

**Figure 8. Quests and rewards**

![](screenshots/08_quests.png){width=3.0in}

**Figure 9. Leaderboard sorted with Merge Sort**

![](screenshots/09_board.png){width=3.0in}

**Figure 10. Weather effect on the field: Rain**

![](screenshots/10_weather_rain.png){width=4.5in}

**Figure 11. Weather effect on the field: Heatwave**

![](screenshots/11_weather_heatwave.png){width=4.5in}

**Figure 12. Weather effect on the field: Thunderstorm**

![](screenshots/12_weather_thunderstorm.png){width=4.5in}

**Figure 13. Weather effect on the field: Typhoon**

![](screenshots/13_weather_typhoon.png){width=4.5in}

**Figure 14. Weather effect on the field: Pests**

![](screenshots/14_weather_pests.png){width=4.5in}

### B. Hierarchical Tree, BFS and DFS (Preorder, Inorder, Postorder)

**Figure 15. Hierarchical Tree: root Garden, each plant is a node**

![](screenshots/15_tree_garden.png){width=6.5in}

**Figure 16. BFS (level order, uses a Queue)**

![](screenshots/16_bfs.png){width=6.5in}

**Figure 17. DFS Preorder (Root, Left, Right) on the example tree**

![](screenshots/17_dfs_preorder.png){width=6.5in}

**Figure 18. DFS Inorder (Left, Root, Right)**

![](screenshots/18_dfs_inorder.png){width=6.5in}

**Figure 19. DFS Postorder (Left, Right, Root), matches the expected order**

![](screenshots/19_dfs_postorder.png){width=6.5in}

### C. Binary Search Tree, Node Mutation and AVL Tree

**Figure 20. Binary Search Tree: demo tree (left < node < right)**

![](screenshots/20_bst_demo.png){width=6.5in}

**Figure 21. BST insert 65**

![](screenshots/21_bst_insert.png){width=6.5in}

**Figure 22. BST search 65 (path of comparisons)**

![](screenshots/22_bst_search.png){width=6.5in}

**Figure 23. BST delete 50 (node with two children: inorder successor, node mutation)**

![](screenshots/23_bst_delete.png){width=6.5in}

**Figure 24. BST inorder gives sorted order**

![](screenshots/24_bst_inorder.png){width=6.5in}

**Figure 25. Sorted inserts make a skewed BST (height = n, O(n) search)**

![](screenshots/25_bst_skewed.png){width=6.5in}

**Figure 26. Rebuild balanced (node mutation: same nodes, new links)**

![](screenshots/26_bst_rebuild.png){width=6.5in}

**Figure 27. AVL tree: the same sorted inserts are balanced by rotations**

![](screenshots/27_avl_demo.png){width=6.5in}

### D. Sorting Algorithms (Sorting Lab)

**Figure 28. Sorting Lab: Bubble Sort (comparisons counted, Big O table)**

![](screenshots/28_sort_bubble.png){width=6.5in}

**Figure 29. Sorting Lab: Insertion Sort (comparisons counted, Big O table)**

![](screenshots/29_sort_insertion.png){width=6.5in}

**Figure 30. Sorting Lab: Selection Sort (comparisons counted, Big O table)**

![](screenshots/30_sort_selection.png){width=6.5in}

**Figure 31. Sorting Lab: Quick Sort (comparisons counted, Big O table)**

![](screenshots/31_sort_quick.png){width=6.5in}

**Figure 32. Sorting Lab: Merge Sort (comparisons counted, Big O table)**

![](screenshots/32_sort_merge.png){width=6.5in}

### E. Hash Tables (Hash Table Lab)

**Figure 33. Hash Table Lab: collisions, chaining vs open addressing, rehashing**

![](screenshots/33_hash_lab.png){width=6.5in}

**Figure 34. Hash table find: steps checked in the bucket**

![](screenshots/34_hash_find.png){width=6.5in}

### F. Requirements map and Code Editor

**Figure 35. Requirements map: where each topic is used in the game**

![](screenshots/35_requirements_map.png){width=6.5in}

**Figure 36. Code Editor tab: the Python topics (here Topic 8, sorting) can be edited and run with Run All**

![](screenshots/36_code_editor.png){width=6.5in}

**Figure 37. Run All 1-10 reloads the Python engine and keeps the game**

![](screenshots/37_code_runall.png){width=6.5in}

### G. Win screen and phone view

**Figure 38. Win screen when Community Hope reaches 100**

![](screenshots/38_win.png){width=6.5in}

**Figure 39. Phone view (390 px wide), no horizontal overflow**

![](screenshots/39_mobile.png){width=2.6in}
