'use client';

import { Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState, type RefObject } from 'react';

interface BlocksPanelProps {
  editorReady: boolean;
  blocksMountRef: RefObject<HTMLDivElement | null>;
}

export function BlocksPanel({ editorReady, blocksMountRef }: BlocksPanelProps) {
  const t = useTranslations('siteStudio.blocksPanel');
  const [blockSearch, setBlockSearch] = useState('');
  const [blockTab, setBlockTab] = useState<'regular' | 'saved'>('regular');

  useEffect(() => {
    if (!editorReady || !blocksMountRef.current) return;

    const term = blockSearch.toLowerCase();
    blocksMountRef.current.querySelectorAll<HTMLElement>('.gjs-block').forEach((element) => {
      const label = element.querySelector('.gjs-block-label')?.textContent?.toLowerCase() ?? '';
      element.style.display = !term || label.includes(term) ? '' : 'none';
    });

    blocksMountRef.current.querySelectorAll<HTMLElement>('.gjs-block-category').forEach((category) => {
      const visibleBlocks = Array.from(category.querySelectorAll<HTMLElement>('.gjs-block'))
        .filter((block) => block.style.display !== 'none').length;
      category.style.display = visibleBlocks === 0 && term ? 'none' : '';
    });
  }, [blockSearch, blocksMountRef, editorReady]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="gjs-blocks-toolbar">
        <div className="gjs-blocks-tabs">
          <button
            className={`gjs-blocks-tab ${blockTab === 'regular' ? 'active' : ''}`}
            onClick={() => setBlockTab('regular')}
          >
            {t('regular')}
          </button>
          <button
            className={`gjs-blocks-tab ${blockTab === 'saved' ? 'active' : ''}`}
            onClick={() => setBlockTab('saved')}
          >
            {t('symbols')}
          </button>
        </div>

        <div className="gjs-blocks-search">
          <Search size={12} className="gjs-blocks-search__icon" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            className="gjs-blocks-search__input"
            value={blockSearch}
            onChange={(event) => setBlockSearch(event.target.value)}
          />
          {blockSearch && (
            <button className="gjs-blocks-search__clear" onClick={() => setBlockSearch('')}>
              <X size={11} />
            </button>
          )}
        </div>
      </div>

      <div style={{ display: blockTab === 'regular' ? 'block' : 'none', flex: 1, overflow: 'auto' }}>
        <div ref={blocksMountRef} />
      </div>

      {blockTab === 'saved' && (
        <div className="gjs-left-panel__placeholder">
          <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.3 }}>[]</div>
          <p>{t('empty')}</p>
        </div>
      )}
    </div>
  );
}
