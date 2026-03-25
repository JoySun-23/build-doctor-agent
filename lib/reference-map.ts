import { Reference } from './types';

export const referenceMap: Record<string, Reference> = {
  react: {
    title: 'React Documentation',
    url: 'https://react.dev',
    type: 'official'
  },
  typescript: {
    title: 'TypeScript Handbook',
    url: 'https://www.typescriptlang.org/docs/handbook/intro.html',
    type: 'official'
  },
  'next-env': {
    title: 'Next.js Environment Variables',
    url: 'https://nextjs.org/docs/app/building-your-application/configuring/environment-variables',
    type: 'official'
  },
  'npm-peer-deps': {
    title: 'npm peerDependencies',
    url: 'https://docs.npmjs.com/cli/v10/configuring-npm/package-json#peerdependencies',
    type: 'official'
  },
  'vite-config': {
    title: 'Vite Configuration',
    url: 'https://vitejs.dev/config/',
    type: 'official'
  },
  webpack: {
    title: 'Webpack Documentation',
    url: 'https://webpack.js.org/concepts/',
    type: 'official'
  },
  node: {
    title: 'Node.js Documentation',
    url: 'https://nodejs.org/docs/latest/api/',
    type: 'official'
  }
};

export function mapReferences(hints: string[]): Reference[] {
  return hints.map(hint => referenceMap[hint]).filter(Boolean);
}
