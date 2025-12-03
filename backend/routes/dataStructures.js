import express from 'express';

const router = express.Router();

// Data structures data
const dataStructures = [
  {
    id: 'list',
    name: 'Lists',
    description: 'Ordered, mutable collections of items',
    example: "my_list = [1, 2, 3, 'hello']"
  },
  {
    id: 'dict',
    name: 'Dictionaries',
    description: 'Key-value pairs, unordered and mutable',
    example: "my_dict = {'name': 'John', 'age': 25}"
  },
  {
    id: 'set',
    name: 'Sets',
    description: 'Unordered collection of unique elements',
    example: 'my_set = {1, 2, 3, 4}'
  },
  {
    id: 'tuple',
    name: 'Tuples',
    description: 'Ordered, immutable collection of items',
    example: "my_tuple = (1, 2, 3, 'hello')"
  },
  {
    id: 'stack',
    name: 'Stack',
    description: 'LIFO (Last In First Out) data structure',
    example: 'stack = []\nstack.append(1)  # push\nstack.pop()  # pop'
  },
  {
    id: 'queue',
    name: 'Queue',
    description: 'FIFO (First In First Out) data structure',
    example: 'from collections import deque\nqueue = deque()\nqueue.append(1)  # enqueue\nqueue.popleft()  # dequeue'
  },
  {
    id: 'linked_list',
    name: 'Linked List',
    description: 'Sequence of nodes where each node contains data and a reference',
    example: 'class Node:\n    def __init__(self, data):\n        self.data = data\n        self.next = None'
  },
  {
    id: 'tree',
    name: 'Binary Tree',
    description: 'Hierarchical data structure with nodes',
    example: 'class TreeNode:\n    def __init__(self, val):\n        self.val = val\n        self.left = None\n        self.right = None'
  }
];

const details = {
  list: {
    name: 'Lists',
    description: 'Lists are ordered, mutable collections of items in Python. They are one of the most commonly used data structures.',
    characteristics: [
      'Ordered: Items maintain their order',
      'Mutable: Can be modified after creation',
      'Allows duplicates',
      'Indexed: Access items by index'
    ],
    operations: [
      'append(x): Add item to end',
      'insert(i, x): Insert item at index i',
      'remove(x): Remove first occurrence',
      'pop(i): Remove and return item at index i',
      'len(list): Get length',
      'list[i]: Access item at index i'
    ],
    time_complexity: {
      access: 'O(1)',
      search: 'O(n)',
      insertion: 'O(n)',
      deletion: 'O(n)'
    },
    code_example: `# Creating a list
my_list = [1, 2, 3, 4, 5]

# Adding elements
my_list.append(6)  # [1, 2, 3, 4, 5, 6]
my_list.insert(0, 0)  # [0, 1, 2, 3, 4, 5, 6]

# Accessing elements
print(my_list[0])  # Output: 0
print(my_list[-1])  # Output: 6 (last element)

# Removing elements
my_list.remove(3)  # Remove first occurrence of 3
popped = my_list.pop()  # Remove and return last element

# Iterating
for item in my_list:
    print(item)`
  },
  dict: {
    name: 'Dictionaries',
    description: 'Dictionaries store key-value pairs. They are unordered (Python 3.7+ maintains insertion order) and mutable.',
    characteristics: [
      'Key-value pairs',
      'Keys must be immutable (strings, numbers, tuples)',
      'Values can be any type',
      'Unordered (pre Python 3.7), ordered (Python 3.7+)',
      'Fast lookups'
    ],
    operations: [
      'dict[key] = value: Add/update key-value',
      'dict.get(key): Get value safely',
      'dict.keys(): Get all keys',
      'dict.values(): Get all values',
      'dict.items(): Get key-value pairs',
      'del dict[key]: Delete key-value pair'
    ],
    time_complexity: {
      access: 'O(1) average',
      search: 'O(1) average',
      insertion: 'O(1) average',
      deletion: 'O(1) average'
    },
    code_example: `# Creating a dictionary
my_dict = {'name': 'Alice', 'age': 30, 'city': 'New York'}

# Accessing values
print(my_dict['name'])  # Output: Alice
print(my_dict.get('age'))  # Output: 30
print(my_dict.get('salary', 0))  # Output: 0 (default if key not found)

# Adding/Updating
my_dict['salary'] = 50000
my_dict['age'] = 31

# Removing
del my_dict['city']
removed = my_dict.pop('salary')

# Iterating
for key, value in my_dict.items():
    print(f"{key}: {value}")`
  },
  set: {
    name: 'Sets',
    description: 'Sets are unordered collections of unique elements. They are useful for membership testing and eliminating duplicates.',
    characteristics: [
      'Unordered: No indexing',
      'Unique: No duplicate elements',
      'Mutable: Can be modified',
      'Fast membership testing'
    ],
    operations: [
      'add(x): Add element',
      'remove(x): Remove element (raises error if not found)',
      'discard(x): Remove element (no error if not found)',
      'union(other): Return union',
      'intersection(other): Return intersection',
      'difference(other): Return difference'
    ],
    time_complexity: {
      access: 'N/A (no indexing)',
      search: 'O(1) average',
      insertion: 'O(1) average',
      deletion: 'O(1) average'
    },
    code_example: `# Creating a set
my_set = {1, 2, 3, 4, 5}

# Adding elements
my_set.add(6)
my_set.update([7, 8, 9])

# Removing elements
my_set.remove(1)  # Raises KeyError if not found
my_set.discard(10)  # No error if not found

# Set operations
set1 = {1, 2, 3}
set2 = {3, 4, 5}

union = set1.union(set2)  # {1, 2, 3, 4, 5}
intersection = set1.intersection(set2)  # {3}
difference = set1.difference(set2)  # {1, 2}

# Membership testing
if 2 in my_set:
    print("2 is in the set")`
  },
  tuple: {
    name: 'Tuples',
    description: 'Tuples are ordered, immutable collections. They are faster than lists and can be used as dictionary keys.',
    characteristics: [
      'Ordered: Maintains order',
      'Immutable: Cannot be modified after creation',
      'Allows duplicates',
      'Can be used as dictionary keys'
    ],
    operations: [
      'tuple[index]: Access element',
      'len(tuple): Get length',
      'tuple.count(x): Count occurrences',
      'tuple.index(x): Find index of element'
    ],
    time_complexity: {
      access: 'O(1)',
      search: 'O(n)',
      insertion: 'N/A (immutable)',
      deletion: 'N/A (immutable)'
    },
    code_example: `# Creating a tuple
my_tuple = (1, 2, 3, 'hello', 'world')

# Accessing elements
print(my_tuple[0])  # Output: 1
print(my_tuple[-1])  # Output: 'world'

# Tuple operations
length = len(my_tuple)
count = my_tuple.count(2)
index = my_tuple.index('hello')

# Unpacking
a, b, c, d, e = my_tuple

# Tuples as dictionary keys (because they're immutable)
coordinates = {(0, 0): 'origin', (1, 2): 'point A'}`
  },
  stack: {
    name: 'Stack',
    description: 'A Stack is a LIFO (Last In First Out) data structure. Items are added and removed from the top.',
    characteristics: [
      'LIFO: Last element added is first to be removed',
      'Operations: push (add) and pop (remove)',
      'Top element is most recently added'
    ],
    operations: [
      'push(x): Add element to top',
      'pop(): Remove and return top element',
      'peek(): View top element without removing',
      'is_empty(): Check if stack is empty'
    ],
    time_complexity: {
      push: 'O(1)',
      pop: 'O(1)',
      peek: 'O(1)',
      search: 'O(n)'
    },
    code_example: `# Stack implementation using list
class Stack:
    def __init__(self):
        self.items = []
    
    def push(self, item):
        self.items.append(item)
    
    def pop(self):
        if self.is_empty():
            return None
        return self.items.pop()
    
    def peek(self):
        if self.is_empty():
            return None
        return self.items[-1]
    
    def is_empty(self):
        return len(self.items) == 0
    
    def size(self):
        return len(self.items)

# Usage
stack = Stack()
stack.push(1)
stack.push(2)
stack.push(3)
print(stack.pop())  # Output: 3
print(stack.peek())  # Output: 2`
  },
  queue: {
    name: 'Queue',
    description: 'A Queue is a FIFO (First In First Out) data structure. Items are added at the rear and removed from the front.',
    characteristics: [
      'FIFO: First element added is first to be removed',
      'Operations: enqueue (add) and dequeue (remove)',
      'Front element is oldest',
      'Rear element is newest'
    ],
    operations: [
      'enqueue(x): Add element to rear',
      'dequeue(): Remove and return front element',
      'peek(): View front element without removing',
      'is_empty(): Check if queue is empty'
    ],
    time_complexity: {
      enqueue: 'O(1)',
      dequeue: 'O(1)',
      peek: 'O(1)',
      search: 'O(n)'
    },
    code_example: `# Queue implementation using deque (efficient)
from collections import deque

class Queue:
    def __init__(self):
        self.items = deque()
    
    def enqueue(self, item):
        self.items.append(item)
    
    def dequeue(self):
        if self.is_empty():
            return None
        return self.items.popleft()
    
    def peek(self):
        if self.is_empty():
            return None
        return self.items[0]
    
    def is_empty(self):
        return len(self.items) == 0
    
    def size(self):
        return len(self.items)

# Usage
queue = Queue()
queue.enqueue(1)
queue.enqueue(2)
queue.enqueue(3)
print(queue.dequeue())  # Output: 1
print(queue.peek())  # Output: 2`
  },
  linked_list: {
    name: 'Linked List',
    description: 'A Linked List is a linear data structure where elements are stored in nodes. Each node contains data and a reference to the next node.',
    characteristics: [
      'Dynamic size: Grows and shrinks as needed',
      'Memory efficient: Allocates memory as needed',
      'No random access: Must traverse from head',
      'Insertion/deletion: O(1) at known position'
    ],
    operations: [
      'insert(data): Add node',
      'delete(data): Remove node',
      'search(data): Find node',
      'display(): Print all nodes'
    ],
    time_complexity: {
      access: 'O(n)',
      search: 'O(n)',
      insertion: 'O(1) at position, O(n) to find',
      deletion: 'O(1) at position, O(n) to find'
    },
    code_example: `# Linked List implementation
class Node:
    def __init__(self, data):
        self.data = data
        self.next = None

class LinkedList:
    def __init__(self):
        self.head = None
    
    def append(self, data):
        new_node = Node(data)
        if not self.head:
            self.head = new_node
            return
        last = self.head
        while last.next:
            last = last.next
        last.next = new_node
    
    def display(self):
        current = self.head
        while current:
            print(current.data, end=" -> ")
            current = current.next
        print("None")
    
    def search(self, data):
        current = self.head
        while current:
            if current.data == data:
                return True
            current = current.next
        return False

# Usage
ll = LinkedList()
ll.append(1)
ll.append(2)
ll.append(3)
ll.display()  # Output: 1 -> 2 -> 3 -> None
print(ll.search(2))  # Output: True`
  },
  tree: {
    name: 'Binary Tree',
    description: 'A Binary Tree is a hierarchical data structure where each node has at most two children: left and right.',
    characteristics: [
      'Hierarchical structure',
      'Each node has at most 2 children',
      'Root node at the top',
      'Leaf nodes have no children'
    ],
    operations: [
      'insert(data): Add node',
      'search(data): Find node',
      'traverse_inorder(): In-order traversal',
      'traverse_preorder(): Pre-order traversal',
      'traverse_postorder(): Post-order traversal'
    ],
    time_complexity: {
      access: 'O(n)',
      search: 'O(n) worst case',
      insertion: 'O(n) worst case',
      deletion: 'O(n) worst case'
    },
    code_example: `# Binary Tree implementation
class TreeNode:
    def __init__(self, val):
        self.val = val
        self.left = None
        self.right = None

class BinaryTree:
    def __init__(self):
        self.root = None
    
    def insert(self, val):
        if not self.root:
            self.root = TreeNode(val)
        else:
            self._insert(self.root, val)
    
    def _insert(self, node, val):
        if val < node.val:
            if node.left:
                self._insert(node.left, val)
            else:
                node.left = TreeNode(val)
        else:
            if node.right:
                self._insert(node.right, val)
            else:
                node.right = TreeNode(val)
    
    def inorder_traversal(self, node):
        if node:
            self.inorder_traversal(node.left)
            print(node.val, end=" ")
            self.inorder_traversal(node.right)
    
    def search(self, val):
        return self._search(self.root, val)
    
    def _search(self, node, val):
        if not node:
            return False
        if node.val == val:
            return True
        return self._search(node.left, val) or self._search(node.right, val)

# Usage
tree = BinaryTree()
tree.insert(5)
tree.insert(3)
tree.insert(7)
tree.insert(2)
tree.insert(4)
tree.inorder_traversal(tree.root)  # Output: 2 3 4 5 7`
  }
};

// @route   GET /api/data-structures
// @desc    Get all data structures
// @access  Public
router.get('/', (req, res) => {
  res.json({ data_structures: dataStructures });
});

// @route   GET /api/data-structures/:id
// @desc    Get data structure details
// @access  Public
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  if (!details[id]) {
    return res.status(404).json({ error: 'Data structure not found' });
  }

  res.json(details[id]);
});

export default router;






