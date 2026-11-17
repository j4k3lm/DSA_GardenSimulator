// Python code for each topic (editable in the Code Editor). The whole game engine is this Python.
const topicTemplates = {
    1: {
        title: "1 · Python OOP: Crops, Resources, Seed Bag & Basket", expect: "CROPS", code: `import json, random

class Crop:
    """Blueprint of one kind of plant. Crop(...) makes one object from this class."""
    def __init__(self, name, emoji, category, seed_cost, grow_secs, value, level, rarity, weight):
        self.name, self.emoji, self.category = name, emoji, category
        self.seed_cost, self.grow_secs = seed_cost, grow_secs     # seed price, seconds to ripen
        self.value, self.level, self.rarity = value, level, rarity  # sell price, unlock level, shop rarity
        self.weight = weight                                      # average weight (kg)

CROPS = [
    Crop("Cabbage",    "🥬", "Vegetable", 5,  20,   9, 1, "common",   0.4),
    Crop("Tomato",   "🍅", "Vegetable", 8,  30,  15, 1, "common",   0.3),
    Crop("Basil",     "🌿", "Herb",      6,  25,  12, 1, "common",   0.1),
    Crop("Eggplant",    "🍆", "Vegetable", 12, 40,  24, 2, "common",   0.5),
    Crop("Chili",      "🌶️", "Vegetable", 14, 45,  28, 2, "uncommon", 0.1),
    Crop("Sunflower", "🌻", "Flower",    15, 50,  32, 2, "uncommon", 0.6),
    Crop("Corn",      "🌽", "Grain",     20, 60,  42, 3, "uncommon", 0.4),
    Crop("Watermelon",    "🍉", "Fruit",     35, 80,  80, 3, "rare",     4.0),
    Crop("Rice",     "🌾", "Grain",     25, 70,  55, 4, "uncommon", 0.3),
    Crop("Banana",    "🍌", "Fruit",     45, 100, 110, 4, "rare",    1.2),
    Crop("Mango",    "🥭", "Fruit",     70, 140, 190, 5, "rare",    0.6),
]
CROP_BY_NAME = {c.name: c for c in CROPS}      # dictionary: fast lookup by name
LEVEL_XP = [0, 40, 110, 220, 380]              # xp needed for level 1..5

class ResourceStorage:
    """Everything the player owns: coins, water, energy, hope, seed bag and fruit basket."""
    MAX = {"water": 100, "energy": 100, "hope": 100}
    BASKET_MAX = 40
    def __init__(self):
        self.coins, self.xp = 40, 0
        self.water, self.energy, self.hope = 100.0, 60.0, 20.0
        self.seeds = {"Cabbage": 3, "Tomato": 2}   # seed bag: crop name -> how many seeds
        self.basket = []                           # harvested fruits waiting to be sold
    def level(self):
        lv = 1
        for i, need in enumerate(LEVEL_XP):
            if self.xp >= need:
                lv = i + 1
        return lv
    def change(self, **delta):                     # e.g. change(coins=-10, water=-3)
        for k, v in delta.items():
            val = getattr(self, k) + v
            setattr(self, k, max(0, min(val, self.MAX.get(k, 10 ** 9))))
    def can_afford(self, coins=0, water=0, energy=0):
        return self.coins >= coins and self.water >= water and self.energy >= energy
    def add_seed(self, name, n=1):
        self.seeds[name] = self.seeds.get(name, 0) + n
    def use_seed(self, name):                      # True if we had a seed to use
        if self.seeds.get(name, 0) <= 0:
            return False
        self.seeds[name] -= 1
        if self.seeds[name] == 0:
            del self.seeds[name]
        return True
    def basket_full(self):
        return len(self.basket) >= self.BASKET_MAX

print("Resources ready. Crops loaded:", len(CROPS))` },
    2: {
        title: "2 · Stack: Action History / Undo (LIFO)", expect: "history", code: `class ActionHistoryStack:
    """STACK (LIFO): the newest action is on top, so Undo takes it first."""
    LIMIT = 20
    def __init__(self):
        self.items = []                      # top of the stack = last element
    def push(self, action):                  # O(1) (append at the end)
        self.items.append(action)
        if len(self.items) > self.LIMIT:
            self.items.pop(0)                # forget the oldest action
    def pop(self):                           # O(1) (remove from the end)
        return self.items.pop() if self.items else None
    def peek(self):                          # look at the top without removing
        return self.items[-1] if self.items else None
    def is_empty(self):
        return len(self.items) == 0
    def size(self):
        return len(self.items)

history = ActionHistoryStack()
print("Stack ready.")` },
    3: {
        title: "3 · Queue: Weather Forecast & Neighbor Orders (FIFO)", expect: "WEATHER", code: `import random
from collections import deque

# name -> (emoji, seconds it lasts, growth speed multiplier, short description)
WEATHER = {
    "Sunny":        dict(emoji="☀️", secs=40, grow=1.0, text="Sunny. Normal growth."),
    "Rain":         dict(emoji="🌧️", secs=30, grow=1.3, text="Rain! Faster growth, +water, Wet mutation."),
    "Thunderstorm": dict(emoji="⛈️", secs=25, grow=1.1, text="Lightning! Plants can get the Shocked mutation (x4)."),
    "Heatwave":     dict(emoji="🔥", secs=30, grow=0.6, text="Extreme heat. Plants wilt."),
    "Typhoon":        dict(emoji="🌀", secs=25, grow=0.4, text="Typhoon! Slow growth and dangerous for plants."),
    "Pests":        dict(emoji="🐛", secs=30, grow=0.8, text="Pests! Plants can get infested."),
}
WEATHER_WEIGHTS = {"Sunny": 4, "Rain": 3, "Thunderstorm": 2, "Heatwave": 2, "Typhoon": 1, "Pests": 2}

class ClimateQueue:
    """QUEUE (FIFO): the first weather that entered is the first to happen."""
    SIZE = 4
    def __init__(self):
        self.items = deque(["Sunny", "Rain"])
        self.fill()
    def enqueue(self, event):                # O(1) add at the back
        self.items.append(event)
    def dequeue(self):                       # O(1) remove from the front
        return self.items.popleft() if self.items else None
    def fill(self):                          # keep the forecast full
        names = list(WEATHER_WEIGHTS)
        while len(self.items) < self.SIZE:
            self.enqueue(random.choices(names, [WEATHER_WEIGHTS[n] for n in names])[0])

class OrderQueue:
    """QUEUE (FIFO): neighbors line up. You serve the one at the FRONT first."""
    MAX = 4
    def __init__(self):
        self.items = deque()
        self.next_id = 1
    def enqueue(self, order):                # new customer joins the back
        self.items.append(order)
    def dequeue(self):                       # front customer leaves
        return self.items.popleft() if self.items else None
    def front(self):
        return self.items[0] if self.items else None
    def is_full(self):
        return len(self.items) >= self.MAX

print("Climate queue and order queue ready.")` },
    4: {
        title: "4 · 2D List: Plant & Garden Grid 6x6", expect: "SIZE", code: `import random

SIZE = 6                                       # the garden is SIZE x SIZE tiles
DEATH_SECONDS = 60                             # a plant that stays sick this long dies
MUTATIONS = {"Wet": 2, "Shocked": 4, "Gold": 5, "Rainbow": 8}   # name -> price multiplier

class Plant:
    """One growing plant. It is shared by the grid cell AND the BST node (same object)."""
    def __init__(self, crop):
        self.crop = crop
        self.uid = None                      # unique plant ID (key of the hash table)
        self.progress = 0.0                  # seconds grown
        self.health = "Healthy"              # Healthy / Wilted / Pest-Infested / Dead
        self.sick_secs = 0.0                 # how long it has been sick
        self.boost = 0.0                     # seconds of fast growth left (watered / solar boost)
        self.mutation = None                 # None / Wet / Shocked / Gold / Rainbow
        self.weight = round(crop.weight * random.uniform(0.8, 1.4), 2)
    def ripe(self):
        return self.progress >= self.crop.grow_secs
    def stage_name(self):
        if self.health == "Dead":
            return "Dead"
        if self.ripe():
            return "Mature"
        return "Seedling" if self.progress < self.crop.grow_secs / 3 else "Growing"
    def set_mutation(self, name):            # keep the BEST mutation only
        if MUTATIONS[name] > MUTATIONS.get(self.mutation, 1):
            self.mutation = name
            return True
        return False
    def value(self):                         # heavier and mutated fruit sells for more
        mult = MUTATIONS.get(self.mutation, 1)
        return max(1, round(self.crop.value * (self.weight / self.crop.weight) * mult))
    def cure(self):
        self.health, self.sick_secs = "Healthy", 0.0
    def grow(self, dt, weather_mult):        # called every game second
        if self.health == "Dead":
            return
        if self.health != "Healthy":         # sick plants do not grow and may die
            self.sick_secs += dt
            if self.sick_secs >= DEATH_SECONDS:
                self.health = "Dead"
            return
        speed = weather_mult * (1.5 if self.boost > 0 else 1.0)
        self.boost = max(0.0, self.boost - dt)
        self.progress = min(self.crop.grow_secs, self.progress + dt * speed)

class GardenGrid:
    """2D LIST: cells[row][col] holds a Plant or None."""
    def __init__(self, rows=SIZE, cols=SIZE):
        # a list comprehension makes a NEW inner list for every row.
        # (Not [[None]*cols]*rows: that repeats the SAME row and breaks the grid!)
        self.rows, self.cols = rows, cols
        self.cells = [[None for _ in range(cols)] for _ in range(rows)]
    def in_range(self, r, c):
        return 0 <= r < self.rows and 0 <= c < self.cols
    def is_empty(self, r, c):                # O(1) direct index
        return self.cells[r][c] is None
    def place(self, r, c, plant):            # O(1)
        self.cells[r][c] = plant
    def remove(self, r, c):                  # O(1)
        p = self.cells[r][c]
        self.cells[r][c] = None
        return p
    def count(self):                         # O(rows * cols): nested loops
        return sum(1 for row in self.cells for p in row if p)

print("Grid ready:", SIZE, "x", SIZE)` },
    5: {
        title: "5 · Hierarchical Tree: Binary Garden Tree", expect: "tview", code: `import json
from collections import deque

class TreeNode:
    _next_id = 0
    def __init__(self, name, label=None, pos=None, cat="Garden"):
        TreeNode._next_id += 1
        self.id = TreeNode._next_id
        self.name, self.label, self.pos, self.cat = name, label or name, pos, cat
        self.parent = self.left = self.right = None
    def depth(self):                         # root = 0
        return 0 if self.parent is None else 1 + self.parent.depth()
    def height(self):                        # leaf = 0, O(n)
        l = self.left.height() if self.left else -1
        r = self.right.height() if self.right else -1
        return 1 + max(l, r)
    def size(self):                          # O(n)
        return 1 + (self.left.size() if self.left else 0) + (self.right.size() if self.right else 0)
    def to_dict(self):
        return {"id": self.id, "label": self.label, "name": self.name, "cat": self.cat,
                "left": self.left.to_dict() if self.left else None,
                "right": self.right.to_dict() if self.right else None}

class BinaryTree:
    def __init__(self, root):
        self.root = root
    def _level_list(self):                   # nodes top-to-bottom, left-to-right (BFS)
        out, q = [], deque([self.root])
        while q:
            n = q.popleft()
            out.append(n)
            if n.left:  q.append(n.left)
            if n.right: q.append(n.right)
        return out
    def insert(self, node):                  # first free slot, O(n)
        for cur in self._level_list():
            if cur.left is None:  cur.left = node;  node.parent = cur; return
            if cur.right is None: cur.right = node; node.parent = cur; return
    def remove_pos(self, pos):               # O(n): the LAST node fills the gap
        nodes = self._level_list()
        target = next((n for n in nodes if n.pos == pos), None)
        if target is None:
            return
        last = nodes[-1]
        if target is not last:               # copy the last node's data into the target
            target.name, target.label, target.pos, target.cat = last.name, last.label, last.pos, last.cat
        p = last.parent
        if p.right is last: p.right = None
        else:               p.left = None
        last.parent = None

class GardenTree(BinaryTree):
    """Root = Garden. Every planted crop becomes a node (left/right children)."""
    def __init__(self):
        super().__init__(TreeNode("Garden", "🌳"))
    def add_plant(self, crop, r, c):
        self.insert(TreeNode("%s(%d,%d)" % (crop.name, r, c), crop.emoji, (r, c), crop.category))
    def remove_plant(self, r, c):
        self.remove_pos((r, c))
    def positions(self):                     # BFS order of plant positions (used by Save)
        return [list(n.pos) for n in self._level_list() if n.pos is not None]

tview = {"which": "garden"}                  # which tree the DSA Lab is showing

def tree_to_json(t, expected=None):
    data = {"root": t.root.to_dict(), "size": t.root.size(), "height": t.root.height(),
            "orders": {}, "expected": expected}
    for k in ("bfs", "preorder", "inorder", "postorder"):   # defined in Topic 6
        if k in globals():
            data["orders"][k] = [[n.id, n.name] for n in globals()[k](t.root)]
    return json.dumps(data)

def tree_json():                             # called by the page
    if tview["which"] == "demo" and "build_demo" in globals():
        return tree_to_json(build_demo(), EXPECTED)
    return tree_to_json(game.tree if "game" in globals() else GardenTree())

print("Binary tree ready.")` },
    6: {
        title: "6 · Tree Traversal: BFS & DFS (Pre/In/Post)", expect: "EXPECTED", code: `from collections import deque

def bfs(root):                               # Level order, uses a QUEUE, O(n)
    out, q = [], deque([root])
    while q:
        n = q.popleft()
        out.append(n)
        if n.left:  q.append(n.left)
        if n.right: q.append(n.right)
    return out

def preorder(n, out=None):                   # Root -> Left -> Right
    out = [] if out is None else out
    if n:
        out.append(n); preorder(n.left, out); preorder(n.right, out)
    return out

def inorder(n, out=None):                    # Left -> Root -> Right
    out = [] if out is None else out
    if n:
        inorder(n.left, out); out.append(n); inorder(n.right, out)
    return out

def postorder(n, out=None):                  # Left -> Right -> Root
    out = [] if out is None else out
    if n:
        postorder(n.left, out); postorder(n.right, out); out.append(n)
    return out

def dfs_stack(root):                         # iterative DFS with an explicit STACK
    out, st = [], [root]
    while st:
        n = st.pop()
        out.append(n)
        if n.right: st.append(n.right)       # push right first -> left pops first
        if n.left:  st.append(n.left)
    return out

# Example tree: A(B(D,E), C(-,F))
def build_demo():
    ns = {k: TreeNode(k) for k in "ABCDEF"}
    for p, side, ch in [("A", "left", "B"), ("A", "right", "C"), ("B", "left", "D"),
                        ("B", "right", "E"), ("C", "right", "F")]:
        setattr(ns[p], side, ns[ch])
        ns[ch].parent = ns[p]
    return BinaryTree(ns["A"])

EXPECTED = {"bfs": "A B C D E F", "preorder": "A B D E C F",
            "inorder": "D B E A C F", "postorder": "D E B F C A"}

def show_demo():
    tview["which"] = "demo"
    return tree_json()

def show_garden_tree():
    tview["which"] = "garden"
    return tree_json()

d = build_demo()
print("dfs_stack == preorder:", [n.name for n in dfs_stack(d.root)] == [n.name for n in preorder(d.root)])
print("Traversals ready: BFS, Preorder, Inorder, Postorder")` },
    7: {
        title: "7 · BST, AVL Tree & Node Mutation: Plant Finder", expect: "demo_avl", code: `import json

class BSTNode:
    _next_id = 0
    def __init__(self, val, name=None, cat="Garden", plant=None):
        BSTNode._next_id += 1
        self.id = BSTNode._next_id
        self.val = val                       # BST key = tile number (row * SIZE + col)
        self.name, self.cat = name or str(val), cat
        self.plant = plant                   # the SAME Plant object that is in the grid cell
        self.height = 1                      # used by the AVL tree (a leaf has height 1)
        self.stage, self.health, self.mutation = "Seedling", "Healthy", None
        self.left = self.right = None

    def refresh(self):                       # NODE MUTATION: update this node IN PLACE from its plant
        if self.plant:
            self.stage = self.plant.stage_name()
            self.health = self.plant.health
            self.mutation = self.plant.mutation

    def copy_from(self, other):              # NODE MUTATION: overwrite this node's data in place
        self.val, self.name, self.cat, self.plant = other.val, other.name, other.cat, other.plant
        self.stage, self.health, self.mutation = other.stage, other.health, other.mutation

    def to_dict(self):
        return {"id": self.id, "label": str(self.val), "name": self.name, "cat": self.cat,
                "stage": self.stage, "health": self.health, "mutation": self.mutation,
                "bf": bst_height(self.right) - bst_height(self.left),   # balance factor shown in the lab
                "left": self.left.to_dict() if self.left else None,
                "right": self.right.to_dict() if self.right else None}

def find_min(node):                          # smallest value in a subtree (inorder successor)
    current = node
    while current.left is not None:
        current = current.left
    return current

class BST:
    """Rule: left values < node value < right values. No duplicates."""
    def __init__(self):
        self.root = None

    def insert(self, val, name=None, cat="Garden", plant=None):   # avg O(log n), worst O(n)
        if self.search(val)[0] is not None:
            return False                                     # duplicate -> reject
        node = BSTNode(val, name, cat, plant)
        node.refresh()
        self.root = self._insert(self.root, node)
        return True

    def _insert(self, root, node):                           # recursive insert
        if root is None:
            return node                                      # empty spot found
        if node.val < root.val:
            root.left = self._insert(root.left, node)        # smaller -> go left
        else:
            root.right = self._insert(root.right, node)      # bigger -> go right
        return root

    def search(self, val):                                   # avg O(log n), worst O(n)
        path = []                                            # remember the steps for the animation
        return self._search(self.root, val, path), path

    def _search(self, root, val, path):                      # recursive search
        if root is None:
            return None
        path.append(root.id)
        if root.val == val:
            return root
        if val < root.val:
            return self._search(root.left, val, path)
        return self._search(root.right, val, path)

    def delete(self, val):                                   # avg O(log n), worst O(n)
        if self.search(val)[0] is None:
            return False                                     # value is not in the tree
        self.root = self._delete(self.root, val)
        return True

    def _delete(self, root, val):                            # recursive delete (3 cases)
        if root is None:
            return root
        if val < root.val:
            root.left = self._delete(root.left, val)
        elif val > root.val:
            root.right = self._delete(root.right, val)
        else:                                                # found the node to delete
            if root.left is None:                            # case 1 (leaf) or case 2 (one child)
                return root.right
            elif root.right is None:                         # case 2 (one child)
                return root.left
            temp = find_min(root.right)                      # case 3: inorder successor
            root.copy_from(temp)                             # NODE MUTATION: copy its data here
            root.right = self._delete(root.right, temp.val)  # then remove the successor node
        return root

    def rebuild_balanced(self):                              # reuse the SAME nodes, change links only
        nodes = bst_inorder(self.root)                       # nodes in sorted order
        self.root = self._build(nodes, 0, len(nodes) - 1)

    def _build(self, nodes, lo, hi):
        if lo > hi:
            return None
        mid = (lo + hi) // 2                                 # middle node becomes the root
        node = nodes[mid]
        node.left = self._build(nodes, lo, mid - 1)
        node.right = self._build(nodes, mid + 1, hi)
        return node

# ----- DFS traversals of the BST (recursive) -----
def bst_inorder(n, out=None):                                # Left, Root, Right -> SORTED values
    out = [] if out is None else out
    if n:
        bst_inorder(n.left, out); out.append(n); bst_inorder(n.right, out)
    return out
def bst_preorder(n, out=None):                               # Root, Left, Right
    out = [] if out is None else out
    if n:
        out.append(n); bst_preorder(n.left, out); bst_preorder(n.right, out)
    return out
def bst_postorder(n, out=None):                              # Left, Right, Root (children first)
    out = [] if out is None else out
    if n:
        bst_postorder(n.left, out); bst_postorder(n.right, out); out.append(n)
    return out
def bst_size(n):
    return 0 if n is None else 1 + bst_size(n.left) + bst_size(n.right)
def bst_height(n):
    return -1 if n is None else 1 + max(bst_height(n.left), bst_height(n.right))

# ----- AVL tree = a BST that balances itself with rotations -----
def get_height(node):                        # empty = 0, leaf = 1
    return node.height if node else 0

def get_balance(node):                       # balance factor = height(right) - height(left)
    return get_height(node.right) - get_height(node.left) if node else 0

def update_height(node):
    node.height = 1 + max(get_height(node.left), get_height(node.right))

def right_rotate(y, log):                    # y is left-heavy: its left child x becomes the parent
    x = y.left
    t2 = x.right
    x.right = y
    y.left = t2
    update_height(y)                         # y is lower now, so update y first
    update_height(x)
    log.append("Right rotation on %s" % y.val)
    return x                                 # x is the new root of this subtree

def left_rotate(x, log):                     # x is right-heavy: its right child y becomes the parent
    y = x.right
    t2 = y.left
    y.left = x
    x.right = t2
    update_height(x)
    update_height(y)
    log.append("Left rotation on %s" % x.val)
    return y

class AVLTree(BST):
    """Same insert/search/delete as BST, but every ancestor is re-checked on the way back up (retracing)."""
    def __init__(self):
        super().__init__()
        self.log = []                        # rotations done by the last insert/delete

    def insert(self, val, name=None, cat="Garden", plant=None):
        self.log = []
        return super().insert(val, name, cat, plant)

    def delete(self, val):
        self.log = []
        return super().delete(val)

    def _insert(self, root, node):
        if root is None:
            return node
        if node.val < root.val:
            root.left = self._insert(root.left, node)
        else:
            root.right = self._insert(root.right, node)
        return self._rebalance(root)         # RETRACING: runs for every ancestor after the recursive call

    def _delete(self, root, val):
        if root is None:
            return root
        if val < root.val:
            root.left = self._delete(root.left, val)
        elif val > root.val:
            root.right = self._delete(root.right, val)
        else:
            if root.left is None:
                return root.right
            elif root.right is None:
                return root.left
            temp = find_min(root.right)      # same 3 cases as the BST
            root.copy_from(temp)             # NODE MUTATION
            root.right = self._delete(root.right, temp.val)
        return self._rebalance(root)

    def _rebalance(self, node):
        update_height(node)
        bal = get_balance(node)
        if bal < -1 and get_balance(node.left) <= 0:     # Left-Left: one right rotation
            return right_rotate(node, self.log)
        if bal < -1 and get_balance(node.left) > 0:      # Left-Right: left on child, then right
            node.left = left_rotate(node.left, self.log)
            return right_rotate(node, self.log)
        if bal > 1 and get_balance(node.right) >= 0:      # Right-Right: one left rotation
            return left_rotate(node, self.log)
        if bal > 1 and get_balance(node.right) < 0:       # Right-Left: right on child, then left
            node.right = right_rotate(node.right, self.log)
            return left_rotate(node, self.log)
        return node

    def rebuild_balanced(self):              # nothing to do: an AVL tree is always balanced
        pass

def tree_shape(n):                           # nested [key, left, right] (used by Save)
    return None if n is None else [n.val, tree_shape(n.left), tree_shape(n.right)]

def balance_info(t):
    n, h = bst_size(t.root), bst_height(t.root)
    best = n.bit_length() - 1 if n else 0                    # smallest possible height = floor(log2 n)
    if h <= best: label = "Balanced"
    elif h == best + 1: label = "Slightly lopsided"
    else: label = "Skewed"
    return {"height": h, "best": best, "label": label}

# ----- the practice (demo) trees shown in the DSA Lab -----
demo_bst = BST()                             # plain BST (can become skewed)
demo_avl = AVLTree()                         # AVL tree (balances itself)
DEMO_KEYS = [50, 30, 70, 20, 40, 60, 80]
for k in DEMO_KEYS:
    demo_bst.insert(k)
    demo_avl.insert(k)
view = {"which": "garden", "path": []}

def current_bst():
    if view["which"] == "garden" and "game" in globals():
        return game.bst
    if view["which"] == "avl":
        return demo_avl
    return demo_bst

def bst_json(path=None, msg=""):                             # called by the page
    t = current_bst()
    orders = {}
    for name, fn in (("inorder", bst_inorder), ("preorder", bst_preorder), ("postorder", bst_postorder)):
        orders[name] = [[n.id, str(n.val)] for n in fn(t.root)]
    if path is None:
        path, view["path"] = view["path"], []                # a path left by the Inspect tool
    return json.dumps({"which": view["which"], "root": t.root.to_dict() if t.root else None,
                       "size": bst_size(t.root), "height": bst_height(t.root),
                       "balance": balance_info(t), "orders": orders, "path": path, "msg": msg,
                       "avl": isinstance(t, AVLTree)})

def show_bst(which):
    view["which"] = which
    return bst_json()

def reset_demo():
    global demo_bst, demo_avl
    demo_bst, demo_avl = BST(), AVLTree()
    for k in DEMO_KEYS:
        demo_bst.insert(k)
        demo_avl.insert(k)
    if view["which"] == "garden":
        view["which"] = "demo"
    return bst_json([], "Demo trees reset.")

def skew_demo():                                             # sorted inserts -> a "linked list" tree
    global demo_bst
    demo_bst = BST()
    for v in (10, 20, 30, 40, 50):
        demo_bst.insert(v)
    view["which"] = "demo"
    msg = "Sorted inserts made a skewed BST: height %d, so search is O(n). Try Rebuild balanced, or the AVL demo." % bst_height(demo_bst.root)
    return bst_json([], msg)

def avl_demo():                                              # SAME sorted inserts, but into an AVL tree
    global demo_avl
    demo_avl = AVLTree()
    moves = []
    for v in (10, 20, 30, 40, 50, 25):
        demo_avl.insert(v)
        moves += demo_avl.log
    view["which"] = "avl"
    msg = "Same sorted inserts into the AVL tree: %d rotation(s), height %d. %s" % (
        len(moves), bst_height(demo_avl.root), "; ".join(moves))
    return bst_json([], msg)

def rebuild():
    t = current_bst()
    if isinstance(t, AVLTree):
        return bst_json([], "An AVL tree is always balanced. No rebuild needed.")
    t.rebuild_balanced()
    return bst_json([], "Rebuilt with the same nodes. Height is now %d." % bst_height(t.root))

def bst_op(op, val):
    t = current_bst()
    if op == "search":
        node, path = t.search(val)
        if node:
            msg = "Found %d (%s) in %d comparisons." % (val, node.name, len(path))
        else:
            msg = "%d not found (%d comparisons)." % (val, len(path))
        return bst_json(path, msg)
    if view["which"] == "garden":
        msg = "The garden tree changes when you plant or harvest. Use the Demo tree or AVL demo to insert/delete."
    elif op == "insert":
        msg = ("Inserted %d." % val) if t.insert(val) else ("%d already exists." % val)
    else:
        msg = ("Deleted %d." % val) if t.delete(val) else ("%d not found." % val)
    if getattr(t, "log", None):
        msg += " Rotations: " + "; ".join(t.log)
    return bst_json([], msg)

print("BST and AVL ready. Demo tree sizes:", bst_size(demo_bst.root), bst_size(demo_avl.root))` },
    8: {
        title: "8 · Sorting: Bubble, Insertion, Selection, Quick, Merge", expect: "SORT_INFO", code: `import json, random

# Every sort returns (sorted_list, comparisons). They work on a COPY, so the original list is not changed.
# key = which value to sort by, reverse = True for biggest first,
# rec = optional list that collects snapshots so the DSA Lab can animate the sort.

def _before(x, y, reverse):                  # should x come BEFORE y?  (strict, so equal items keep their order)
    return x > y if reverse else x < y

def _snap(rec, a):
    if rec is not None and len(rec) < 600:
        rec.append(list(a))

def bubble_sort(items, key=lambda x: x, reverse=False, rec=None):
    a, comps = list(items), 0
    for i in range(len(a) - 1):              # after pass i the biggest i+1 items are in place
        swapped = False
        for j in range(len(a) - 1 - i):
            comps += 1
            if _before(key(a[j + 1]), key(a[j]), reverse):   # neighbors in the wrong order
                a[j], a[j + 1] = a[j + 1], a[j]
                swapped = True
                _snap(rec, a)
        if not swapped:                      # no swap in a full pass = already sorted (best case O(n))
            break
    return a, comps

def insertion_sort(items, key=lambda x: x, reverse=False, rec=None):
    a, comps = list(items), 0
    for i in range(1, len(a)):               # a[0:i] is already sorted
        cur, j = a[i], i - 1
        while j >= 0:
            comps += 1
            if _before(key(cur), key(a[j]), reverse):
                a[j + 1] = a[j]              # shift the bigger item to the right
                j -= 1
            else:
                break
        a[j + 1] = cur                       # drop the item into its gap
        _snap(rec, a)
    return a, comps

def selection_sort(items, key=lambda x: x, reverse=False, rec=None):
    a, comps = list(items), 0
    for i in range(len(a) - 1):
        best = i                             # index of the smallest (or biggest) item in a[i:]
        for j in range(i + 1, len(a)):
            comps += 1
            if _before(key(a[j]), key(a[best]), reverse):
                best = j
        if best != i:
            a[i], a[best] = a[best], a[i]
            _snap(rec, a)
    return a, comps

def quick_sort(items, key=lambda x: x, reverse=False, rec=None):
    a, comps = list(items), [0]
    def sort(lo, hi):
        if lo >= hi:
            return
        pivot, i = key(a[hi]), lo            # pivot = last item
        for j in range(lo, hi):
            comps[0] += 1
            if _before(key(a[j]), pivot, reverse):
                a[i], a[j] = a[j], a[i]      # move items that belong before the pivot to the left side
                i += 1
        a[i], a[hi] = a[hi], a[i]            # pivot goes to its final place
        _snap(rec, a)
        sort(lo, i - 1)                      # sort the left part
        sort(i + 1, hi)                      # sort the right part
    sort(0, len(a) - 1)
    return a, comps[0]

def merge_sort(items, key=lambda x: x, reverse=False, rec=None):
    a, comps = list(items), [0]
    def sort(lo, hi):                        # sorts a[lo..hi]
        if lo >= hi:
            return
        mid = (lo + hi) // 2
        sort(lo, mid)                        # divide
        sort(mid + 1, hi)
        left, right = a[lo:mid + 1], a[mid + 1:hi + 1]
        i = j = 0
        k = lo
        while i < len(left) and j < len(right):          # merge two sorted halves
            comps[0] += 1
            if _before(key(right[j]), key(left[i]), reverse):
                a[k] = right[j]; j += 1
            else:
                a[k] = left[i]; i += 1       # ties take the LEFT item first = stable
            k += 1
        while i < len(left):
            a[k] = left[i]; i += 1; k += 1
        while j < len(right):
            a[k] = right[j]; j += 1; k += 1
        _snap(rec, a)
    sort(0, len(a) - 1)
    return a, comps[0]

SORTS = {"bubble": bubble_sort, "insertion": insertion_sort, "selection": selection_sort,
         "quick": quick_sort, "merge": merge_sort}
SORT_INFO = [
    {"id": "bubble",    "name": "Bubble Sort",    "best": "O(n)",       "avg": "O(n^2)",     "worst": "O(n^2)", "space": "O(1)",     "stable": "Yes"},
    {"id": "insertion", "name": "Insertion Sort", "best": "O(n)",       "avg": "O(n^2)",     "worst": "O(n^2)", "space": "O(1)",     "stable": "Yes"},
    {"id": "selection", "name": "Selection Sort", "best": "O(n^2)",     "avg": "O(n^2)",     "worst": "O(n^2)", "space": "O(1)",     "stable": "No"},
    {"id": "quick",     "name": "Quick Sort",     "best": "O(n log n)", "avg": "O(n log n)", "worst": "O(n^2)", "space": "O(log n)", "stable": "No"},
    {"id": "merge",     "name": "Merge Sort",     "best": "O(n log n)", "avg": "O(n log n)", "worst": "O(n log n)", "space": "O(n)", "stable": "Yes"},
]

def sort_lab(name, size, seed):              # called by the DSA Lab: returns animation frames as JSON
    rng = random.Random(seed)
    nums = [rng.randint(5, 99) for _ in range(size)]
    frames = [list(nums)]
    result, comps = SORTS[name](nums, rec=frames)
    info = next(x for x in SORT_INFO if x["id"] == name)
    return json.dumps({"id": name, "frames": frames, "comps": comps, "sorted": result == sorted(nums), "info": info})

def sort_table():
    return json.dumps(SORT_INFO)

print("Sorting ready:", ", ".join(SORTS))` },
    9: {
        title: "9 · Hash Table: Chaining, Open Addressing & Rehashing", expect: "demo_chain", code: `import json

class HashTable:
    """HASH TABLE with SEPARATE CHAINING: every bucket is a list, so keys that
    land in the same bucket (a COLLISION) simply share that list."""
    def __init__(self, size=8, max_load=0.75):
        self.buckets = [[] for _ in range(size)]      # list of buckets, each bucket = list of [key, value]
        self.count, self.max_load = 0, max_load
        self.collisions, self.rehashes = 0, 0

    def hash(self, key):                              # key -> bucket number
        h = 0
        for ch in str(key):
            h = (h * 31 + ord(ch)) % 1000003          # position matters ("abc" != "cba")
        return h % len(self.buckets)                  # use the CURRENT size, not a fixed 10

    def load_factor(self):                            # n / m : items per bucket
        return self.count / len(self.buckets)

    def put(self, key, value):                        # average O(1)
        idx = self.hash(key)
        for pair in self.buckets[idx]:                # walk the chain
            if pair[0] == key:
                pair[1] = value                       # same key: update only
                return {"index": idx, "collision": False, "updated": True, "rehashed": None}
        collided = len(self.buckets[idx]) > 0         # bucket already has another key
        if collided:
            self.collisions += 1
        self.buckets[idx].append([key, value])        # CHAINING: add to the end of the chain
        self.count += 1
        rehashed = self.rehash() if self.load_factor() > self.max_load else None
        return {"index": idx, "collision": collided, "updated": False, "rehashed": rehashed}

    def get(self, key):                               # returns (value, bucket, steps)
        idx = self.hash(key)
        steps = 0
        for k, v in self.buckets[idx]:
            steps += 1
            if k == key:
                return v, idx, steps
        return None, idx, steps

    def remove(self, key):
        idx = self.hash(key)
        for i, pair in enumerate(self.buckets[idx]):
            if pair[0] == key:
                del self.buckets[idx][i]
                self.count -= 1
                return True
        return False

    def rehash(self):                                 # REHASHING: grow the table and re-place every key
        old_size = len(self.buckets)
        old_items = [pair for bucket in self.buckets for pair in bucket]
        self.buckets = [[] for _ in range(old_size * 2)]   # double the number of buckets
        for k, v in old_items:                        # the new size gives NEW bucket numbers
            self.buckets[self.hash(k)].append([k, v])
        self.rehashes += 1
        return [old_size, len(self.buckets)]          # O(n), but rare, so average put stays O(1)

    def to_dict(self):
        return {"kind": "chain", "size": len(self.buckets), "count": self.count,
                "load": round(self.load_factor(), 2), "max_load": self.max_load,
                "collisions": self.collisions, "rehashes": self.rehashes,
                "max_chain": max(len(b) for b in self.buckets),
                "slots": [[p[0] for p in b] for b in self.buckets]}

class OpenAddressTable:
    """HASH TABLE with OPEN ADDRESSING (linear probing): one key per slot.
    If the slot is taken, look at the NEXT slot (wrap around) until a free one is found."""
    DELETED = "<deleted>"                             # tombstone so searches do not stop too early
    def __init__(self, size=8, max_load=0.5):
        self.slots = [None] * size                    # None = empty, DELETED = tombstone, else [key, value]
        self.count, self.used, self.max_load = 0, 0, max_load   # used = live keys + tombstones
        self.collisions, self.rehashes = 0, 0

    def hash(self, key):
        h = 0
        for ch in str(key):
            h = (h * 31 + ord(ch)) % 1000003
        return h % len(self.slots)

    def load_factor(self):
        return self.used / len(self.slots)

    def put(self, key, value):
        start = self.hash(key)
        first_free = None                             # first tombstone we pass (can be reused)
        for step in range(len(self.slots)):
            i = (start + step) % len(self.slots)      # linear probing: +1 each time
            s = self.slots[i]
            if s is None:                             # empty slot: the key is not in the table
                target, probes = (first_free if first_free is not None else i), step + 1
                break
            if s is self.DELETED:
                if first_free is None:
                    first_free = i
            elif s[0] == key:
                s[1] = value
                return {"index": i, "collision": False, "updated": True, "probes": step + 1, "rehashed": None}
        else:                                         # no empty slot at all
            target, probes = first_free, len(self.slots)
        collided = target != start
        if collided:
            self.collisions += 1
        if self.slots[target] is None:
            self.used += 1
        self.slots[target] = [key, value]
        self.count += 1
        rehashed = self.rehash() if self.load_factor() > self.max_load else None
        return {"index": target, "collision": collided, "updated": False, "probes": probes, "rehashed": rehashed}

    def get(self, key):                               # returns (value, slot, probes)
        start = self.hash(key)
        for step in range(len(self.slots)):
            i = (start + step) % len(self.slots)
            s = self.slots[i]
            if s is None:
                return None, i, step + 1
            if s is not self.DELETED and s[0] == key:
                return s[1], i, step + 1
        return None, start, len(self.slots)

    def remove(self, key):
        start = self.hash(key)
        for step in range(len(self.slots)):
            i = (start + step) % len(self.slots)
            s = self.slots[i]
            if s is None:
                return False
            if s is not self.DELETED and s[0] == key:
                self.slots[i] = self.DELETED          # tombstone, NOT None
                self.count -= 1
                return True
        return False

    def rehash(self):
        old_size = len(self.slots)
        old_items = [s for s in self.slots if s is not None and s is not self.DELETED]
        self.slots = [None] * (old_size * 2)
        self.count = self.used = 0
        for k, v in old_items:                        # tombstones disappear here
            i = self.hash(k)
            while self.slots[i] is not None:
                i = (i + 1) % len(self.slots)
            self.slots[i] = [k, v]
            self.count += 1
            self.used += 1
        self.rehashes += 1
        return [old_size, len(self.slots)]

    def to_dict(self):
        return {"kind": "open", "size": len(self.slots), "count": self.count,
                "load": round(self.load_factor(), 2), "max_load": self.max_load,
                "collisions": self.collisions, "rehashes": self.rehashes, "max_chain": 0,
                "slots": [None if s is None else ("x" if s is self.DELETED else s[0]) for s in self.slots]}

# ----- practice tables shown in the DSA Lab (same keys go into both) -----
demo_chain = HashTable(5, 0.75)
demo_open = OpenAddressTable(5, 0.5)
HASH_SAMPLE = ["Cabbage", "Tomato", "Basil", "Eggplant", "Chili", "Corn", "Watermelon", "Banana"]

def hash_json(msg=""):                                # called by the page
    garden = game.registry.to_dict() if "game" in globals() else None
    return json.dumps({"garden": garden, "chain": demo_chain.to_dict(), "open": demo_open.to_dict(), "msg": msg})

def hash_op(op, key):
    global demo_chain, demo_open
    if op == "reset":
        demo_chain, demo_open = HashTable(5, 0.75), OpenAddressTable(5, 0.5)
        return hash_json("Both demo tables are empty (5 buckets).")
    parts = []
    keys = HASH_SAMPLE if op == "sample" else [key]
    for k in keys:
        if op in ("insert", "sample"):
            a, b = demo_chain.put(k, 1), demo_open.put(k, 1)
            parts.append("%s: chaining bucket %d%s%s | open slot %d%s%s" % (
                k, a["index"], " (collision, chain grows)" if a["collision"] else "",
                (" REHASH %d->%d" % tuple(a["rehashed"])) if a["rehashed"] else "",
                b["index"], (" (collision, probed %d slots)" % b["probes"]) if b["collision"] else "",
                (" REHASH %d->%d" % tuple(b["rehashed"])) if b["rehashed"] else ""))
        elif op == "find":
            _, i, s1 = demo_chain.get(k)
            v2, j, s2 = demo_open.get(k)
            parts.append("%s: chaining checked %d key(s) in bucket %d | open checked %d slot(s)" % (k, s1, i, s2))
        elif op == "delete":
            parts.append("%s: chaining %s | open %s (tombstone)" % (k, demo_chain.remove(k), demo_open.remove(k)))
    return hash_json("  ||  ".join(parts[-3:]))

print("Hash tables ready: chaining and open addressing")` },
    10: {
        title: "10 · Game Engine: puts everything together", expect: "game", code: `import json, random
from collections import deque

NPCS = [("Aunt Nena", "👵"), ("Uncle Berting", "👴"), ("Jun", "🧑‍🌾"),
        ("Liza", "👩"), ("Grandpa Ben", "🧓"), ("Little Migo", "👦")]
QUESTS = [  # (text, stat name, target, coin reward)
    ("Harvest 5 crops", "harvested", 5, 40),
    ("Earn 100 coins from selling", "earned", 100, 50),
    ("Deliver 2 orders", "delivered", 2, 80),
    ("Harvest 1 mutated crop", "mutated", 1, 100),
    ("Reach Level 3", "level", 3, 120),
]

FARMERS = [("Aunt Nena", "👵", 1.3), ("Uncle Berting", "👴", 0.9), ("Jun", "🧑‍🌾", 1.7),
           ("Liza", "👩", 1.1), ("Grandpa Ben", "🧓", 0.6)]       # rivals on the leaderboard
BASKET_KEYS = {"weight": lambda f: f["weight"], "value": lambda f: f["value"],
               "name": lambda f: f["crop"], "mutation": lambda f: MUTATIONS.get(f["mut"], 1)}
SHOP_KEYS = ("level", "cost", "secs", "value", "name")

class Game:
    """The whole game. It USES every data structure: 2D grid, hierarchical tree, BST,
    stack (undo), queues (weather + orders)."""
    def __init__(self):
        self.res = ResourceStorage()
        self.grid = GardenGrid()                 # 2D list
        self.tree = GardenTree()                 # hierarchical tree (BFS order)
        self.bst = AVLTree()                     # self-balancing search tree, key = tile number
        self.registry = HashTable(8)             # HASH TABLE: plant ID -> [row, col]
        self.next_uid = 1
        self.shop_sort, self.basket_note, self.board_note = "level", "", ""
        self.history = ActionHistoryStack()      # stack
        self.climate = ClimateQueue()            # queue
        self.orders = OrderQueue()               # queue
        self.clock, self.ver, self.events = 0.0, 0, []
        self.weather = self.climate.dequeue()
        self.climate.fill()
        self.weather_left = WEATHER[self.weather]["secs"]
        self.stock, self.restock_left = {}, 0
        self.restock()
        self.order_left = 6.0
        self.stats = {"harvested": 0, "earned": 0, "delivered": 0, "mutated": 0}
        self.quest_done = []
        self.won = False
        self.new_order()

    # ---------- small helpers ----------
    def key(self, r, c):                         # tile number used as the BST key
        return r * SIZE + c
    def say(self, kind, **data):                 # events for the page: toast / fx / sfx
        data["t"] = kind
        self.events.append(data)
    def fx(self, text, r=None, c=None, good=True):
        self.say("fx", text=text, r=r, c=c, good=good)
    def plant_at(self, r, c):
        return self.grid.cells[r][c] if self.grid.in_range(r, c) else None
    def remove_plant(self, r, c):                # keep ALL structures in sync
        p = self.grid.remove(r, c)
        self.registry.remove(p.uid)
        self.tree.remove_plant(r, c)
        self.bst.delete(self.key(r, c))
        self.ver += 1

    # ---------- shop ----------
    def restock(self):
        self.stock = {}
        for c in CROPS:
            lo, hi = {"common": (5, 10), "uncommon": (2, 5), "rare": (0, 2)}[c.rarity]
            self.stock[c.name] = random.randint(lo, hi)
        self.restock_left = 45.0
        self.say("toast", text="The Seed Shop has restocked! 🛒")
        self.say("sfx", name="restock")

    def act_buy(self, name):
        crop = CROP_BY_NAME.get(name)
        if crop is None: return "No such seed."
        if crop.level > self.res.level(): return "%s unlocks at Level %d." % (name, crop.level)
        if self.stock.get(name, 0) <= 0: return "Sold out! Wait for the restock."
        if self.res.coins < crop.seed_cost: return "Not enough coins."
        self.res.change(coins=-crop.seed_cost)
        self.stock[name] -= 1
        self.res.add_seed(name)
        self.say("sfx", name="buy")
        return "Bought a %s seed." % name

    # ---------- farming ----------
    def act_plant(self, r, c, name):
        crop = CROP_BY_NAME.get(name)
        if crop is None or not self.grid.in_range(r, c): return "Pick a seed first."
        if not self.grid.is_empty(r, c): return "There is already a plant on this tile."
        if not self.res.use_seed(name): return "You have no %s seed. Buy one in the shop." % name
        plant = Plant(crop)
        plant.uid = "P%03d" % self.next_uid      # unique ID
        self.next_uid += 1
        roll = random.random()                   # small chance of a lucky mutation
        if roll < 0.004: plant.set_mutation("Rainbow")
        elif roll < 0.03: plant.set_mutation("Gold")
        self.grid.place(r, c, plant)             # 2D list
        self.tree.add_plant(crop, r, c)          # hierarchical tree
        self.bst.insert(self.key(r, c), "%s(%d,%d)" % (crop.name, r, c), crop.category, plant)  # BST
        self.history.push({"r": r, "c": c, "crop": name})   # stack
        info = self.registry.put(plant.uid, [r, c])         # hash table (may rehash)
        if info["rehashed"]:
            self.say("toast", text="🔁 Hash table rehashed: %d → %d buckets (load factor passed %.2f)" % (
                info["rehashed"][0], info["rehashed"][1], self.registry.max_load))
        self.ver += 1
        self.say("sfx", name="plant")
        if plant.mutation:
            self.fx("✨ " + plant.mutation + "!", r, c)
        return "Planted %s." % name

    def act_harvest(self, r, c):
        p = self.plant_at(r, c)
        if p is None: return "There is no plant here."
        if p.health == "Dead":
            self.remove_plant(r, c)
            self.say("sfx", name="clear")
            return "Cleared the dead plant."
        if not p.ripe(): return "Not ripe yet."
        if self.res.basket_full(): return "The basket is full! Sell first."
        self._collect(r, c, p)
        self.say("sfx", name="harvest")
        return "Harvested: %s" % p.crop.name

    def _collect(self, r, c, p):
        self.res.basket.append({"crop": p.crop.name, "emoji": p.crop.emoji, "cat": p.crop.category,
                                "weight": p.weight, "value": p.value(), "mut": p.mutation})
        xp = max(2, p.crop.value // 3)
        self.res.xp += xp
        self.res.change(hope=1)
        self.stats["harvested"] += 1
        if p.mutation: self.stats["mutated"] += 1
        self.fx("+%d xp" % xp, r, c)
        self.remove_plant(r, c)

    def act_harvest_all(self):
        picked = 0
        for node in bst_inorder(self.bst.root):  # DFS inorder: collect first, delete after
            p = node.plant
            if p.ripe() and p.health != "Dead":
                if self.res.basket_full(): break
                r, c = divmod(node.val, SIZE)
                self._collect(r, c, p)
                picked += 1
        if picked: self.say("sfx", name="harvest")
        return "Harvested %d crops." % picked if picked else "Nothing is ripe yet (or the basket is full)."

    def act_water(self, r, c):
        p = self.plant_at(r, c)
        if p is None or p.health == "Dead": return "There is no living plant here."
        if not self.res.can_afford(water=3): return "Not enough water (3 L)."
        self.res.change(water=-3)
        p.boost = 15.0                           # grows faster for 15 s
        if p.health == "Wilted": p.cure()
        self.bst.search(self.key(r, c))[0].refresh()     # NODE MUTATION via search
        self.say("sfx", name="water")
        self.fx("💧", r, c)
        return "Watered the plant."

    def act_spray(self, r, c):
        p = self.plant_at(r, c)
        if p is None or p.health == "Dead": return "There is no living plant here."
        if p.health != "Pest-Infested": return "This plant has no pests."
        if not self.res.can_afford(coins=6): return "Not enough coins (6)."
        self.res.change(coins=-6)
        p.cure()
        self.bst.search(self.key(r, c))[0].refresh()
        self.say("sfx", name="spray")
        self.fx("🧴", r, c)
        return "Sprayed the pests away."

    def act_boost(self):
        if not self.res.can_afford(energy=40): return "Not enough Solar energy (40)."
        self.res.change(energy=-40)
        for node in bst_inorder(self.bst.root):
            node.plant.boost += 30.0
        self.say("sfx", name="boost")
        return "⚡ Solar Boost! All plants grow faster for 30 s."

    def act_undo(self):
        a = self.history.pop()                   # STACK: newest action first
        if a is None: return "Nothing to undo (the stack is empty)."
        p = self.plant_at(a["r"], a["c"])
        if p is None or p.crop.name != a["crop"]: return "That plant is gone."
        self.remove_plant(a["r"], a["c"])
        self.res.add_seed(a["crop"])
        self.say("sfx", name="undo")
        return "Undo: returned the %s seed." % a["crop"]

    def act_prune(self):                         # postorder: children are visited before parents
        dead = [n for n in bst_postorder(self.bst.root) if n.plant.health == "Dead"]
        for node in dead:
            self.remove_plant(*divmod(node.val, SIZE))
        if dead: self.say("sfx", name="clear")
        return "Cleared %d dead plants (postorder)." % len(dead) if dead else "No dead plants."

    def act_inspect(self, r, c):
        node, path = self.bst.search(self.key(r, c))
        if node is None: return "No plant at (%d,%d)." % (r, c)
        p = node.plant
        view["which"], view["path"] = "garden", path
        _, bucket, steps = self.registry.get(p.uid)         # hash table lookup by plant ID
        return "%s · %s · %s%s · %.2f kg · ₱%d · found in %d step(s) (BST) · ID %s → bucket %d, %d step(s) (hash, load %.2f)." % (
            node.name, node.stage, node.health, (" · " + node.mutation) if node.mutation else "",
            p.weight, p.value(), len(path), p.uid, bucket, steps, self.registry.load_factor())

    # ---------- sorting ----------
    def act_sort_basket(self, by="weight", desc=True):   # INSERTION SORT: small list, often almost sorted
        if by not in BASKET_KEYS: return "Unknown sort."
        if len(self.res.basket) < 2: return "Not enough fruit in the basket to sort."
        self.res.basket, comps = insertion_sort(self.res.basket, key=BASKET_KEYS[by], reverse=desc)
        self.basket_note = "Insertion sort by %s (%s): %d comparisons for %d fruits" % (
            by, "high to low" if desc else "low to high", comps, len(self.res.basket))
        self.say("sfx", name="plant")
        return self.basket_note

    def act_shop_sort(self, by="level"):
        if by not in SHOP_KEYS: return "Unknown sort."
        self.shop_sort = by
        return "Shop sorted by %s." % by

    def score(self):
        return self.stats["earned"] + 10 * self.stats["harvested"] + 25 * self.stats["delivered"]

    def leaderboard(self):                       # MERGE SORT: stable, always O(n log n)
        rows = [{"name": "You", "face": "🌱", "score": self.score(), "me": True}]
        for i, (name, face, rate) in enumerate(FARMERS):
            rows.append({"name": name, "face": face, "score": int(20 * (i + 1) + rate * self.clock / 3), "me": False})
        ranked, comps = merge_sort(rows, key=lambda r: r["score"], reverse=True)
        for i, r in enumerate(ranked):
            r["rank"] = i + 1
        self.board_note = "Merge sort: %d comparisons for %d farmers" % (comps, len(rows))
        return ranked

    # ---------- selling and orders ----------
    def act_sell(self):
        basket = self.res.basket
        if not basket: return "The basket is empty."
        total = sum(f["value"] for f in basket)
        kinds = len({f["cat"] for f in basket})
        bonus = round(total * 0.05 * (kinds - 1)) if kinds > 1 else 0   # biodiversity bonus
        self.res.change(coins=total + bonus)
        self.stats["earned"] += total + bonus
        n = len(basket)
        self.res.basket = []
        self.say("sfx", name="sell")
        self.fx("+%d 🪙" % (total + bonus), None, None)
        return "Sold %d fruits: +%d coins%s." % (n, total + bonus,
               (" (biodiversity +%d)" % bonus) if bonus else "")

    def new_order(self):
        lv = self.res.level()
        crop = random.choice([c for c in CROPS if c.level <= lv])
        qty = random.randint(1, 2 + lv // 2)
        who = random.choice(NPCS)
        self.orders.enqueue({"id": self.orders.next_id, "npc": who[0], "face": who[1],
                             "crop": crop.name, "emoji": crop.emoji, "qty": qty,
                             "reward": int(qty * crop.value * 1.6) + 5, "ttl": 90.0})
        self.orders.next_id += 1

    def act_deliver(self):
        o = self.orders.front()                  # QUEUE: serve the front customer only
        if o is None: return "No order is waiting."
        mine = sorted((f for f in self.res.basket if f["crop"] == o["crop"]), key=lambda f: f["value"])
        if len(mine) < o["qty"]:
            return "Needed: %d× %s in the basket (you have: %d)." % (o["qty"], o["crop"], len(mine))
        for f in mine[:o["qty"]]:
            self.res.basket.remove(f)
        self.orders.dequeue()
        self.res.change(coins=o["reward"], hope=3)
        self.res.xp += 10 + o["qty"] * 3
        self.stats["delivered"] += 1
        self.stats["earned"] += o["reward"]
        self.say("sfx", name="deliver")
        self.fx("+%d 🪙" % o["reward"], None, None)
        return "Delivered to %s! +%d coins." % (o["npc"], o["reward"])

    def act_claim(self, i):
        text, stat, target, reward = QUESTS[i]
        value = self.res.level() if stat == "level" else self.stats[stat]
        if i in self.quest_done: return "Already claimed."
        if value < target: return "The quest is not finished yet."
        self.quest_done.append(i)
        self.res.change(coins=reward, hope=2)
        self.say("sfx", name="quest")
        return "Quest complete! +%d coins." % reward

    def act_new_game(self):
        self.__init__()
        return "New game!"

    # ---------- time ----------
    def tick(self, dt):                          # dt = real seconds that passed
        while dt > 0:
            step = min(dt, 1.0)
            dt -= step
            self._step(step)

    def next_weather(self):
        self.weather = self.climate.dequeue()    # QUEUE: oldest forecast first
        self.climate.fill()
        w = WEATHER[self.weather]
        self.weather_left = w["secs"]
        if self.weather == "Rain": self.res.change(water=40)
        if self.weather == "Typhoon": self.res.change(hope=-2)
        self.say("toast", text="%s %s: %s" % (w["emoji"], self.weather, w["text"]))
        self.say("sfx", name="weather")

    def _weather_on_plant(self, p, dt):
        w, roll = self.weather, random.random()
        if p.health == "Dead": return
        if w == "Rain":
            if p.health == "Wilted": p.cure()
            if roll < 0.05 * dt: p.set_mutation("Wet")
        elif w == "Thunderstorm":
            if roll < 0.03 * dt: p.set_mutation("Shocked")
        elif p.health == "Healthy":
            chance = {"Heatwave": 0.04, "Typhoon": 0.06, "Sunny": 0.002}.get(w, 0.002) * dt
            if roll < chance: p.health = "Wilted"
            elif w == "Pests" and roll < 0.05 * dt: p.health = "Pest-Infested"

    def _step(self, dt):
        self.clock += dt
        self.res.change(water=0.8 * dt, energy=0.6 * dt)
        self.weather_left -= dt
        if self.weather_left <= 0: self.next_weather()
        mult = WEATHER[self.weather]["grow"]
        for node in bst_inorder(self.bst.root):  # DFS inorder visits every plant once
            p, before = node.plant, node.plant.health
            self._weather_on_plant(p, dt)
            p.grow(dt, mult)
            node.refresh()                       # NODE MUTATION: node follows its plant
            if p.health == "Dead" and before != "Dead":
                self.res.change(hope=-3)
                r, c = divmod(node.val, SIZE)
                self.say("toast", text="💀 %s died. Clear it (Prune)." % node.name)
                self.fx("💀", r, c, False)
        self.restock_left -= dt
        if self.restock_left <= 0: self.restock()
        self.order_left -= dt
        if self.order_left <= 0:
            if not self.orders.is_full(): self.new_order()
            self.order_left = 22.0
        front = self.orders.front()
        if front:
            front["ttl"] -= dt
            if front["ttl"] <= 0:
                self.orders.dequeue()
                self.res.change(hope=-3)
                self.say("toast", text="😞 %s left. The order took too long." % front["npc"])
        if self.res.hope >= 100 and not self.won:
            self.won = True
            self.say("win")

    # ---------- data for the page ----------
    def cell(self, p):
        if p is None: return None
        c = p.crop
        return {"uid": p.uid, "crop": c.name, "e": c.emoji, "p": round(100 * p.progress / c.grow_secs),
                "stage": p.stage_name(), "h": p.health, "m": p.mutation, "ripe": p.ripe(),
                "val": p.value(), "w": p.weight}

    def snapshot(self, msg=""):
        r = self.res
        events, self.events = self.events, []
        quests = []
        for i, (text, stat, target, reward) in enumerate(QUESTS):
            value = r.level() if stat == "level" else self.stats[stat]
            quests.append({"i": i, "text": text, "value": min(value, target), "target": target,
                           "reward": reward, "done": i in self.quest_done})
        lv = r.level()
        crops = [{"name": c.name, "e": c.emoji, "cat": c.category, "cost": c.seed_cost,
                  "secs": c.grow_secs, "value": c.value, "level": c.level, "rarity": c.rarity} for c in CROPS]
        if self.shop_sort != "level":            # merge sort keeps the level order for ties (stable)
            crops, _ = merge_sort(crops, key=lambda c: c[self.shop_sort], reverse=(self.shop_sort == "value"))
        return json.dumps({
            "msg": msg, "events": events, "ver": self.ver, "won": self.won,
            "coins": r.coins, "water": round(r.water), "energy": round(r.energy), "hope": round(r.hope),
            "xp": r.xp, "level": lv, "xp_from": LEVEL_XP[lv - 1],
            "xp_to": LEVEL_XP[lv] if lv < len(LEVEL_XP) else None,
            "seeds": r.seeds, "basket": r.basket, "basket_max": r.BASKET_MAX,
            "clock": round(self.clock, 1), "weather": self.weather,
            "weather_left": round(self.weather_left), "forecast": list(self.climate.items),
            "stock": self.stock, "restock_left": round(self.restock_left),
            "orders": list(self.orders.items), "quests": quests,
            "history": list(self.history.items), "plants": self.grid.count(),
            "cells": [[self.cell(p) for p in row] for row in self.grid.cells],
            "weather_info": {k: {"emoji": v["emoji"], "grow": v["grow"], "text": v["text"]} for k, v in WEATHER.items()},
            "crops": crops, "shop_sort": self.shop_sort, "basket_note": self.basket_note,
            "board": self.leaderboard(), "board_note": self.board_note,
            "registry": {"size": len(self.registry.buckets), "count": self.registry.count,
                         "load": round(self.registry.load_factor(), 2), "rehashes": self.registry.rehashes}})

    def to_dict(self):
        r = self.res
        plants = []
        for node in bst_preorder(self.bst.root):
            p = node.plant
            rr, cc = divmod(node.val, SIZE)
            plants.append({"uid": p.uid, "r": rr, "c": cc, "crop": p.crop.name, "progress": p.progress, "health": p.health,
                           "sick": p.sick_secs, "boost": p.boost, "mut": p.mutation, "weight": p.weight})
        return {"coins": r.coins, "xp": r.xp, "water": r.water, "energy": r.energy, "hope": r.hope,
                "seeds": r.seeds, "basket": r.basket, "clock": self.clock, "weather": self.weather,
                "weather_left": self.weather_left, "forecast": list(self.climate.items),
                "stock": self.stock, "restock_left": self.restock_left, "order_left": self.order_left,
                "orders": list(self.orders.items), "next_id": self.orders.next_id,
                "stats": self.stats, "quest_done": self.quest_done, "won": self.won,
                "history": self.history.items, "plants": plants,
                "bst_shape": tree_shape(self.bst.root),             # exact AVL shape (rotations make order matter)
                "tree_order": self.tree.positions(),                # BFS order = rebuilds same tree shape
                "next_uid": self.next_uid, "shop_sort": self.shop_sort,
                "reg_size": len(self.registry.buckets), "reg_rehashes": self.registry.rehashes}

    @staticmethod
    def from_dict(d):
        g = Game()
        r = g.res
        r.coins, r.xp, r.water, r.energy, r.hope = d["coins"], d["xp"], d["water"], d["energy"], d["hope"]
        r.seeds, r.basket = d["seeds"], d["basket"]
        g.clock, g.weather, g.weather_left = d["clock"], d["weather"], d["weather_left"]
        g.climate.items = deque(d["forecast"])
        g.stock, g.restock_left, g.order_left = d["stock"], d["restock_left"], d["order_left"]
        g.orders.items, g.orders.next_id = deque(d["orders"]), d["next_id"]
        g.stats, g.quest_done, g.won = d["stats"], d["quest_done"], d["won"]
        g.history.items = d["history"]
        made = {}
        for pd in d["plants"]:                   # grid cells
            p = Plant(CROP_BY_NAME[pd["crop"]])
            p.progress, p.health, p.sick_secs = pd["progress"], pd["health"], pd["sick"]
            p.boost, p.mutation, p.weight = pd["boost"], pd["mut"], pd["weight"]
            p.uid = pd["uid"]
            g.grid.place(pd["r"], pd["c"], p)
            made[(pd["r"], pd["c"])] = p
        def build(shape):                        # rebuild the exact saved BST shape
            if shape is None:
                return None
            rr, cc = divmod(shape[0], SIZE)
            p = made[(rr, cc)]
            node = BSTNode(shape[0], "%s(%d,%d)" % (p.crop.name, rr, cc), p.crop.category, p)
            node.refresh()
            node.left, node.right = build(shape[1]), build(shape[2])
            update_height(node)
            return node
        g.bst.root = build(d["bst_shape"])
        g.registry = HashTable(d["reg_size"])    # same size, so no rehash while loading
        for pd in d["plants"]:
            g.registry.put(pd["uid"], [pd["r"], pd["c"]])
        g.registry.rehashes = d["reg_rehashes"]
        g.next_uid, g.shop_sort = d["next_uid"], d["shop_sort"]
        for r_, c_ in d["tree_order"]:           # hierarchical tree: insert in saved BFS order
            g.tree.add_plant(made[(r_, c_)].crop, r_, c_)
        g.events = []
        return g

# ----- functions the web page calls (all return JSON text) -----
game = Game()

def game_state():
    return game.snapshot()

def game_tick(dt):
    game.tick(dt)
    return game.snapshot()

def game_do(cmd, args="{}"):
    fn = getattr(game, "act_" + cmd, None)       # only methods named act_...
    if fn is None:
        return game.snapshot("Unknown command: " + cmd)
    return game.snapshot(fn(**json.loads(args)))

def save_json():
    return json.dumps(game.to_dict())

def load_json(text, away=0):
    global game
    game = Game.from_dict(json.loads(text))
    game.tick(min(away, 120))                    # offline catch-up (max 2 minutes)
    game.events = []
    return game.snapshot("Welcome back!" if away > 5 else "")

print("Game engine ready. Garden tiles:", SIZE * SIZE)` }
};
