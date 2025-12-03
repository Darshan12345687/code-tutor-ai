import React from 'react';
import './MarkdownMessage.css';

interface MarkdownMessageProps {
  content: string;
  language?: string;
}

const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ content, language = 'python' }) => {
  const parseMarkdown = (text: string) => {
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    let i = 0;
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeBlockLanguage = '';

    while (i < lines.length) {
      const line = lines[i];

      // Handle code blocks
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          // End of code block
          elements.push(
            <div key={`code-${i}`} className="markdown-code-block">
              <div className="code-block-header">
                <span className="code-language">{codeBlockLanguage || language}</span>
                <button 
                  className="copy-code-btn"
                  onClick={() => {
                    const content = codeBlockContent.join('\n');
                    navigator.clipboard.writeText(content);
                  }}
                  title="Copy code"
                >
                  📋 Copy
                </button>
              </div>
              <pre className="code-content">
                <code>{codeBlockContent.join('\n')}</code>
              </pre>
            </div>
          );
          codeBlockContent = [];
          codeBlockLanguage = '';
          inCodeBlock = false;
        } else {
          // Start of code block
          inCodeBlock = true;
          codeBlockLanguage = line.replace('```', '').trim() || language;
        }
        i++;
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        i++;
        continue;
      }

      // Handle headers
      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={`h3-${i}`} className="markdown-h3">
            {line.replace('### ', '').trim()}
          </h3>
        );
        i++;
        continue;
      }

      if (line.startsWith('## ')) {
        elements.push(
          <h2 key={`h2-${i}`} className="markdown-h2">
            {line.replace('## ', '').trim()}
          </h2>
        );
        i++;
        continue;
      }

      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={`h1-${i}`} className="markdown-h1">
            {line.replace('# ', '').trim()}
          </h1>
        );
        i++;
        continue;
      }

      // Handle horizontal rules
      if (line.trim() === '---' || line.trim().startsWith('---')) {
        elements.push(<hr key={`hr-${i}`} className="markdown-hr" />);
        i++;
        continue;
      }

      // Handle tables
      if (line.includes('|') && line.trim().startsWith('|')) {
        const tableRows: string[] = [];
        let j = i;
        while (j < lines.length && lines[j].includes('|') && lines[j].trim().startsWith('|')) {
          if (!lines[j].trim().match(/^\|[\s-|:]+\|$/)) { // Skip separator rows
            tableRows.push(lines[j]);
          }
          j++;
        }
        
        if (tableRows.length > 0) {
          const tableData = tableRows.map(row => {
            const cells = row.split('|').map(cell => cell.trim()).filter(cell => cell);
            return cells;
          });

          if (tableData.length > 0) {
            const headers = tableData[0];
            const rows = tableData.slice(1);

            elements.push(
              <div key={`table-${i}`} className="markdown-table-container">
                <table className="markdown-table">
                  <thead>
                    <tr>
                      {headers.map((header, idx) => (
                        <th key={idx}>{parseInlineMarkdown(header)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, rowIdx) => (
                      <tr key={rowIdx}>
                        {row.map((cell, cellIdx) => (
                          <td key={cellIdx}>{parseInlineMarkdown(cell)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
          i = j;
          continue;
        }
      }

      // Handle lists
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ') || /^\d+\.\s/.test(line.trim())) {
        const listItems: string[] = [];
        let j = i;
        while (j < lines.length && (
          lines[j].trim().startsWith('- ') || 
          lines[j].trim().startsWith('* ') || 
          /^\d+\.\s/.test(lines[j].trim()) ||
          (lines[j].trim() === '' && j < lines.length - 1 && (
            lines[j + 1].trim().startsWith('- ') || 
            lines[j + 1].trim().startsWith('* ') || 
            /^\d+\.\s/.test(lines[j + 1].trim())
          ))
        )) {
          if (lines[j].trim() !== '') {
            listItems.push(lines[j].trim());
          }
          j++;
        }

        if (listItems.length > 0) {
          elements.push(
            <ul key={`list-${i}`} className="markdown-list">
              {listItems.map((item, idx) => {
                const cleanItem = item.replace(/^[-*]\s/, '').replace(/^\d+\.\s/, '');
                return (
                  <li key={idx} className="markdown-list-item">
                    {parseInlineMarkdown(cleanItem)}
                  </li>
                );
              })}
            </ul>
          );
          i = j;
          continue;
        }
      }

      // Handle regular paragraphs
      if (line.trim() !== '') {
        const paragraphLines: string[] = [];
        let j = i;
        while (j < lines.length && lines[j].trim() !== '' && 
               !lines[j].startsWith('#') && 
               !lines[j].startsWith('```') &&
               !lines[j].includes('|') &&
               !lines[j].trim().startsWith('- ') &&
               !lines[j].trim().startsWith('* ') &&
               !/^\d+\.\s/.test(lines[j].trim()) &&
               lines[j].trim() !== '---') {
          paragraphLines.push(lines[j]);
          j++;
        }

        if (paragraphLines.length > 0) {
          const paragraphText = paragraphLines.join(' ').trim();
          if (paragraphText) {
            elements.push(
              <p key={`p-${i}`} className="markdown-paragraph">
                {parseInlineMarkdown(paragraphText)}
              </p>
            );
          }
          i = j;
          continue;
        }
      }

      // Empty line - add spacing
      if (line.trim() === '') {
        elements.push(<div key={`spacer-${i}`} className="markdown-spacer" />);
      }

      i++;
    }

    // Handle any remaining code block
    if (inCodeBlock && codeBlockContent.length > 0) {
      elements.push(
        <div key={`code-final`} className="markdown-code-block">
          <div className="code-block-header">
            <span className="code-language">{codeBlockLanguage || language}</span>
            <button 
              className="copy-code-btn"
              onClick={() => {
                navigator.clipboard.writeText(codeBlockContent.join('\n'));
              }}
              title="Copy code"
            >
              📋 Copy
            </button>
          </div>
          <pre className="code-content">
            <code>{codeBlockContent.join('\n')}</code>
          </pre>
        </div>
      );
    }

    return elements;
  };

  const parseInlineMarkdown = (text: string): (string | JSX.Element)[] => {
    const parts: (string | JSX.Element)[] = [];

    // Handle bold text **text**
    const boldRegex = /\*\*(.+?)\*\*/g;
    let match;
    let lastIndex = 0;

    while ((match = boldRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      // Add bold text
      parts.push(<strong key={`bold-${match.index}`}>{match[1]}</strong>);
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      const remaining = text.substring(lastIndex);
      // Handle inline code `code`
      const codeRegex = /`([^`]+)`/g;
      let codeMatch;
      let codeLastIndex = 0;
      const codeParts: (string | JSX.Element)[] = [];

      while ((codeMatch = codeRegex.exec(remaining)) !== null) {
        if (codeMatch.index > codeLastIndex) {
          codeParts.push(remaining.substring(codeLastIndex, codeMatch.index));
        }
        codeParts.push(
          <code key={`inline-code-${codeMatch.index}`} className="markdown-inline-code">
            {codeMatch[1]}
          </code>
        );
        codeLastIndex = codeMatch.index + codeMatch[0].length;
      }

      if (codeLastIndex < remaining.length) {
        codeParts.push(remaining.substring(codeLastIndex));
      }

      if (codeParts.length > 0) {
        parts.push(...codeParts);
      } else {
        parts.push(remaining);
      }
    }

    return parts.length > 0 ? parts : [text];
  };

  return <div className="markdown-message">{parseMarkdown(content)}</div>;
};

export default MarkdownMessage;





