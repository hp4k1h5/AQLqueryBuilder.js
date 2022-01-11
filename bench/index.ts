import { parseQuery, parseQueryEXP } from '../src/parse'

const queries = [
  '  What song was or do you want to be the your first dance at your wedding',
  'What song would make the best theme music for you',
  'What is the most irrational superstition you have',
  'What is "the weirdest food" combination "you enjoy"',
  'What is the stupidest thing you ever did on a dare',
  'What is the worst date you have ever been on',
  'Who is the most embarrassing person you had a crush on',
  'What is your idea of the "perfect day"',
  'If you could swap lives with one of your friends, who would it be',
  'Who knows the most secrets about you',
  // 'What are your must-have qualities in a best friend',
  // 'If you had to get a tattoo today, what would you get',
  // 'If you could have free meals for life at one fast food chain, which one would you choose',
  // 'What is the most embarrassing thing your parents have ever done',
  // 'What is a lie or exaggeration you said to impress a crush',
  // 'What is the silliest you have ever felt',
  // 'When was the last time you laughed so hard that you cried',
  // 'What "does your mother yell at you" when she’s angry',
  // 'What is a telltale sign that you are upset',
  // 'What is your nickname',
  // 'What is the wackiest thing you ever did to help a friend',
  // 'What fictional character would you most like to be friends with',
  // 'What is your favorite topic to talk about',
]

function benchIter(fn, iterations = 1) {
  const start = new Date().valueOf()
  for (let i = 0; i < iterations; i++) {
    fn()
  }
  console.log(new Date().valueOf() - start)
}

function fun(fn) {
  queries.forEach((q, i) => {
    fn(q)
  })
}

benchIter(() => fun(parseQuery))
benchIter(() => fun(parseQueryEXP))
