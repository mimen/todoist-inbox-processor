import { parseTodoistLinks } from './todoist-link-parser'

// Test cases
const testCases = [
  {
    input: '[Goldigger Remix](https://soundcloud.com/pineapple_flow/goldigger-remix/s-Ts3AmRJJFYS)',
    expected: [
      { type: 'link', content: 'Goldigger Remix', url: 'https://soundcloud.com/pineapple_flow/goldigger-remix/s-Ts3AmRJJFYS' }
    ]
  },
  {
    input: 'Check out [this link](https://example.com) and [another one](https://test.com)!',
    expected: [
      { type: 'text', content: 'Check out ' },
      { type: 'link', content: 'this link', url: 'https://example.com' },
      { type: 'text', content: ' and ' },
      { type: 'link', content: 'another one', url: 'https://test.com' },
      { type: 'text', content: '!' }
    ]
  },
  {
    input: 'No links here, just plain text',
    expected: [
      { type: 'text', content: 'No links here, just plain text' }
    ]
  },
  {
    input: 'Text before [link](http://test.com)',
    expected: [
      { type: 'text', content: 'Text before ' },
      { type: 'link', content: 'link', url: 'http://test.com' }
    ]
  }
]

// Run tests
console.log('Testing Todoist link parser...\n')

testCases.forEach((testCase, index) => {
  const result = parseTodoistLinks(testCase.input)
  const passed = JSON.stringify(result) === JSON.stringify(testCase.expected)
  
  console.log(`Test ${index + 1}: ${passed ? '✅ PASSED' : '❌ FAILED'}`)
  console.log(`  Input: "${testCase.input}"`)
  if (!passed) {
    console.log(`  Expected:`, testCase.expected)
    console.log(`  Got:`, result)
  }
  console.log()
})