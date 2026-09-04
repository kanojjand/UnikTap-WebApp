'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, Input, Switch, Textarea } from '@/components/ui/input'
import { Tabs } from '@/components/ui/tabs'
import { deleteFaq, saveFaq, saveSettings, saveStaticPage } from '@/lib/actions/admin-content'
import type { FaqItem, StaticPage } from '@/types/domain'

export function ContentEditor({
  faq,
  pages,
  announcement,
}: {
  faq: FaqItem[]
  pages: StaticPage[]
  announcement: { enabled: boolean; text_ru: string; text_kk: string; link: string }
}) {
  const [tab, setTab] = useState('faq')
  const [, startTransition] = useTransition()

  function run(action: () => Promise<{ ok: boolean; error?: string }>, message: string) {
    startTransition(async () => {
      const result = await action()
      if (result.ok) toast.success(message)
      else toast.error(result.error ?? 'Ошибка')
    })
  }

  return (
    <div className="space-y-4">
      <Tabs
        className="bg-white rounded-2xl px-4 pt-4 border border-gray-100"
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'faq', label: `FAQ (${faq.length})` },
          { id: 'pages', label: `Страницы (${pages.length})` },
          { id: 'banner', label: 'Баннер' },
        ]}
      />

      {tab === 'faq' ? <FaqEditor faq={faq} run={run} /> : null}
      {tab === 'pages' ? <PagesEditor pages={pages} run={run} /> : null}
      {tab === 'banner' ? <BannerEditor announcement={announcement} run={run} /> : null}
    </div>
  )
}

type Runner = (action: () => Promise<{ ok: boolean; error?: string }>, message: string) => void

function FaqEditor({ faq, run }: { faq: FaqItem[]; run: Runner }) {
  const [draft, setDraft] = useState({ question_ru: '', answer_ru: '', category: 'general' })

  return (
    <div className="space-y-3">
      {faq.map((item) => (
        <div key={item.id} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
          <div className="flex justify-between gap-4">
            <Input
              surface="admin"
              defaultValue={item.question_ru}
              aria-label="Вопрос"
              onBlur={(event) => event.target.value !== item.question_ru && run(() => saveFaq({ id: item.id, question_ru: event.target.value }), 'Сохранено')}
            />
            <button onClick={() => run(() => deleteFaq(item.id), 'Удалено')} className="text-gray-400 hover:text-red-600 p-2" aria-label="Удалить">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <Textarea
            surface="admin"
            rows={3}
            defaultValue={item.answer_ru}
            aria-label="Ответ"
            onBlur={(event) => event.target.value !== item.answer_ru && run(() => saveFaq({ id: item.id, answer_ru: event.target.value }), 'Сохранено')}
          />
          <Textarea
            surface="admin"
            rows={2}
            defaultValue={item.answer_kk ?? ''}
            aria-label="Ответ KZ"
            placeholder="Ответ на казахском"
            onBlur={(event) => event.target.value !== item.answer_kk && run(() => saveFaq({ id: item.id, answer_kk: event.target.value }), 'Сохранено')}
          />
        </div>
      ))}

      <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-5 space-y-3">
        <Field label="Новый вопрос">
          {({ id }) => <Input id={id} surface="admin" value={draft.question_ru} onChange={(event) => setDraft({ ...draft, question_ru: event.target.value })} />}
        </Field>
        <Field label="Ответ">
          {({ id }) => <Textarea id={id} surface="admin" rows={3} value={draft.answer_ru} onChange={(event) => setDraft({ ...draft, answer_ru: event.target.value })} />}
        </Field>
        <Button
          disabled={!draft.question_ru || !draft.answer_ru}
          onClick={() => {
            run(() => saveFaq({ ...draft, sort_order: 100, is_published: true }), 'Добавлено')
            setDraft({ question_ru: '', answer_ru: '', category: 'general' })
          }}
        >
          <Plus className="w-4 h-4" aria-hidden /> Добавить вопрос
        </Button>
      </div>
    </div>
  )
}

function PagesEditor({ pages, run }: { pages: StaticPage[]; run: Runner }) {
  return (
    <div className="space-y-3">
      {pages.map((page) => (
        <div key={page.id} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-gray-400">/{page.slug}</span>
            <Input
              surface="admin"
              defaultValue={page.title_ru}
              aria-label="Заголовок"
              onBlur={(event) => event.target.value !== page.title_ru && run(() => saveStaticPage({ id: page.id, slug: page.slug, title_ru: event.target.value }), 'Сохранено')}
            />
          </div>
          <Textarea
            surface="admin"
            rows={8}
            defaultValue={page.content_ru ?? ''}
            aria-label="Содержимое RU (markdown)"
            className="font-mono text-xs"
            onBlur={(event) => event.target.value !== page.content_ru && run(() => saveStaticPage({ id: page.id, slug: page.slug, content_ru: event.target.value }), 'Сохранено')}
          />
          <Textarea
            surface="admin"
            rows={6}
            defaultValue={page.content_kk ?? ''}
            aria-label="Содержимое KZ (markdown)"
            placeholder="Казахская версия — если пусто, покажем русскую"
            className="font-mono text-xs"
            onBlur={(event) => event.target.value !== page.content_kk && run(() => saveStaticPage({ id: page.id, slug: page.slug, content_kk: event.target.value }), 'Сохранено')}
          />
        </div>
      ))}
    </div>
  )
}

function BannerEditor({
  announcement,
  run,
}: {
  announcement: { enabled: boolean; text_ru: string; text_kk: string; link: string }
  run: Runner
}) {
  const [value, setValue] = useState(announcement)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 max-w-2xl">
      <label className="flex items-center gap-3 text-sm text-gray-700">
        <Switch checked={value.enabled} onChange={(enabled) => setValue({ ...value, enabled })} label="Показывать баннер" />
        Показывать баннер на главной
      </label>
      <Field label="Текст RU">
        {({ id }) => <Input id={id} surface="admin" value={value.text_ru} onChange={(event) => setValue({ ...value, text_ru: event.target.value })} />}
      </Field>
      <Field label="Текст KZ">
        {({ id }) => <Input id={id} surface="admin" value={value.text_kk} onChange={(event) => setValue({ ...value, text_kk: event.target.value })} />}
      </Field>
      <Field label="Ссылка">
        {({ id }) => <Input id={id} surface="admin" value={value.link} onChange={(event) => setValue({ ...value, link: event.target.value })} />}
      </Field>
      <Button onClick={() => run(() => saveSettings({ announcement: value }), 'Баннер сохранён')}>Сохранить</Button>
    </div>
  )
}
