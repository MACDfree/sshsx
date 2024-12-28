<script setup>
import { ref } from 'vue'

const props = defineProps({
  files: {
    type: Array,
    required: true,
    default: () => []
  }
})

const isOpen = ref({})

const toggleFolder = (path) => {
  isOpen.value[path] = !isOpen.value[path]
}

const getIcon = (item) => {
  if (item.type === 'folder') {
    return isOpen.value[item.path] ? '📂' : '📁'
  }
  return '📄'
}
</script>

<template>
  <div class="file-tree">
    <TreeNode
      v-for="file in files"
      :key="file.path"
      :file="file"
      :level="0"
    />
  </div>
</template>

<script>
// TreeNode component
const TreeNode = {
  name: 'TreeNode',
  props: {
    file: {
      type: Object,
      required: true
    },
    level: {
      type: Number,
      default: 0
    }
  },
  setup(props) {
    const isOpen = ref(false)
    
    const toggle = () => {
      if (props.file.type === 'folder') {
        isOpen.value = !isOpen.value
      }
    }
    
    return { isOpen, toggle }
  },
  template: `
    <div class="tree-node" :style="{ marginLeft: level * 20 + 'px' }">
      <div 
        class="node-content"
        @click="toggle"
        :class="{ 'is-folder': file.type === 'folder' }"
      >
        <span class="icon">{{ file.type === 'folder' ? (isOpen ? '📂' : '📁') : '📄' }}</span>
        <span class="name">{{ file.name }}</span>
      </div>
      <div v-if="file.type === 'folder' && isOpen" class="children">
        <TreeNode
          v-for="child in file.children"
          :key="child.path"
          :file="child"
          :level="level + 1"
        />
      </div>
    </div>
  `
}
</script>

<style scoped>
.file-tree {
  font-family: Arial, sans-serif;
  padding: 10px;
}

.tree-node {
  padding: 2px 0;
}

.node-content {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.node-content:hover {
  background-color: #f0f0f0;
}

.icon {
  margin-right: 6px;
}

.is-folder {
  font-weight: 500;
}

.children {
  margin-top: 2px;
}
</style>