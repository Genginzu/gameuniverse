import { getLegalTranslator, type LegalPage, type LegalTranslator } from "@/lib/legal/legalMessages";
import {
  buildLegalRichTags,
  getHiddenLegalItems,
  type LegalRichTags,
} from "@/components/legal/legalRichTags";

interface TableMessages {
  head: Record<string, string>;
  rows: Record<string, Record<string, string>>;
}

interface BlockProps {
  t: LegalTranslator;
  path: string;
  id: string;
  value: unknown;
  tags: LegalRichTags;
  hidden: string[];
  blockKey: string;
}

function LegalTable({ path, value }: { path: string; value: TableMessages }) {
  const columns = Object.keys(value.head);
  return (
    <table>
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column}>{value.head[column]}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Object.entries(value.rows).map(([rowKey, row]) => (
          <tr key={`${path}.${rowKey}`}>
            {columns.map((column) => (
              <td key={column}>{row[column]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function LegalBlock({ t, path, id, value, tags, hidden, blockKey }: BlockProps) {
  const type = blockKey.split("_")[0];
  switch (type) {
    case "h2":
      return <h2 id={id}>{t.rich(path, tags)}</h2>;
    case "h3":
      return <h3 id={id}>{t.rich(path, tags)}</h3>;
    case "p":
      return <p>{t.rich(path, tags)}</p>;
    case "ul":
      return (
        <ul>
          {Object.keys(value as Record<string, string>)
            .filter((item) => !hidden.includes(`${blockKey}.${item}`))
            .map((item) => (
              <li key={item}>{t.rich(`${path}.${item}`, tags)}</li>
            ))}
        </ul>
      );
    case "table":
      return <LegalTable path={path} value={value as TableMessages} />;
    default:
      return null;
  }
}

/**
 * Renders a legal page from `src/messages/legal/<locale>.json`.
 * The block type comes from the key prefix: `h2_`, `h3_`, `p_`, `ul_`
 * (object of list items) and `table_` (`head` + `rows`). The key suffix is
 * reused as the heading anchor (e.g. `h2_mediation` → `#mediation`).
 */
export async function LegalDocument({ locale, page }: { locale: string; page: LegalPage }) {
  const t = await getLegalTranslator(locale);
  const tags = buildLegalRichTags(t);
  const hidden = getHiddenLegalItems();
  const content = t.raw(`${page}.content`) as Record<string, unknown>;

  return (
    <>
      {Object.entries(content).map(([blockKey, value]) => (
        <LegalBlock
          key={blockKey}
          t={t}
          path={`${page}.content.${blockKey}`}
          id={blockKey.slice(blockKey.indexOf("_") + 1)}
          value={value}
          tags={tags}
          hidden={hidden}
          blockKey={blockKey}
        />
      ))}
    </>
  );
}
