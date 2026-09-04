import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import { cn } from '@/lib/utils'

/** Markdown из БД рендерится только через санитайзер (раздел 13). */
export function Markdown({ children, className }: { children: string; className?: string }) {
  if (!children) return null

  return (
    <div
      className={cn(
        'text-sm leading-relaxed text-gray-600 max-w-prose space-y-3',
        '[&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-5',
        '[&_h3]:font-bold [&_h3]:text-gray-900 [&_h3]:mt-4',
        '[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mt-1',
        '[&_a]:text-corpBlue [&_a]:underline [&_strong]:text-gray-900',
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
        {children}
      </ReactMarkdown>
    </div>
  )
}
