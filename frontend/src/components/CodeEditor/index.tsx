import React, {Ref, useEffect, useImperativeHandle, useRef} from 'react';
import AceEditor from "react-ace";

import 'ace-builds/src-noconflict/mode-sql';
import 'ace-builds/src-noconflict/mode-json';
import "ace-builds/src-noconflict/mode-mysql";
import 'ace-builds/src-noconflict/mode-pgsql';
import 'ace-builds/src-noconflict/mode-sqlserver';
import "ace-builds/src-noconflict/mode-java";
import 'ace-builds/src-noconflict/ext-searchbox';
import "ace-builds/src-noconflict/ext-language_tools";
import {addCompleter} from 'ace-builds/src-noconflict/ext-language_tools';


import 'ace-builds/src-noconflict/theme-terminal';
import 'ace-builds/src-noconflict/theme-xcode';
import {Ace} from "ace-builds";
import {IAceOptions, ICommand, IEditorProps, IMarker} from "react-ace/src/types";


export type CodeEditorProps = {
  tables?: any[];
  onRef?: React.RefObject<any>;
  name?: string;
  style?: React.CSSProperties;
  /** For available modes see https://github.com/thlorenz/brace/tree/master/mode */
  mode: string | object;
  /** For available themes see https://github.com/thlorenz/brace/tree/master/theme */
  theme?: string;
  height?: string;
  width?: string;
  className?: string;
  fontSize?: number | string;
  showGutter?: boolean;
  showPrintMargin?: boolean;
  highlightActiveLine?: boolean;
  focus?: boolean;
  cursorStart?: number;
  wrapEnabled?: boolean;
  readOnly?: boolean;
  minLines?: number;
  maxLines?: number;
  navigateToFileEnd?: boolean;
  debounceChangePeriod?: number;
  enableBasicAutocompletion?: boolean | string[];
  enableLiveAutocompletion?: boolean | string[];
  tabSize?: number;
  value?: string;
  placeholder?: string;
  defaultValue?: string;
  scrollMargin?: number[];
  enableSnippets?: boolean;
  onSelectionChange?: (value: any, event?: any) => void;
  onCursorChange?: (value: any, event?: any) => void;
  onInput?: (event?: any) => void;
  onLoad?: (editor: Ace.Editor) => void;
  onValidate?: (annotations: Ace.Annotation[]) => void;
  onChange?: (value: string, event?: any) => void;
  onSelection?: (selectedText: string, event?: any) => void;
  onCopy?: (value: string) => void;
  onPaste?: (value: string) => void;
  onFocus?: (event: any, editor?: Ace.Editor) => void;
  onBlur?: (event: any, editor?: Ace.Editor) => void;
  onScroll?: (editor: IEditorProps) => void;
  editorProps?: IEditorProps;
  setOptions?: IAceOptions;
  keyboardHandler?: string;
  commands?: ICommand[];
  annotations?: Ace.Annotation[];
  markers?: IMarker[];
};

const CodeEditor: React.FC<CodeEditorProps> = ({ onRef, ...props }) => {
  const {mode, height, width, name, placeholder, value, theme, ref, onChange, tables} = props;
  console.log(63, mode || 'mysql');

  const editorRef = useRef(null);

  const updateAutoCompleteData = (tables: string[], fields: string[]) => {
    console.log(110, tables, fields)
    if (editorRef.current) {
      const editor = editorRef.current.editor;
      const session = editor.getSession();
      const sqlCompleter = {
        getCompletions: (editor: any, session: any, pos: any, prefix: any, callback: any) => {
          callback(null, [
            ...tables.map(table => ({ name: table, value: table, score: 1000, meta: 'Table' })),
            ...fields.map(field => ({ name: field, value: field, score: 900, meta: 'Field' })),
          ]);
        }
      };
      session.setMode("ace/mode/sql");
      editor.completers = [sqlCompleter];
    }
  };

  useImperativeHandle(onRef, () => ({
    getSelectValue: () => {
      console.log(130, editorRef.current)
      // @ts-ignore
      return editorRef.current.editor.getSelectedText();
    },
    setSelectValue: (value: string) => {
      console.log(130, editorRef.current)
      // @ts-ignore
      return editorRef.current.editor.insert(value);
    },
    updateAutoCompleteData,
  }));

  useEffect(() => {
    addCompleter({
      getCompletions: (editor: any, session: any, pos: any, prefix: any, callback: any) => {
        callback(null, (tables || []).map(v => (
          {name: v, value: v}
        )));
      }
    });
  }, [])

  return (<>
    <AceEditor
      ref={editorRef}
      width={width || '100%'}
      height={height || '300px'}
      mode={mode || 'sql'}
      theme={theme || 'xcode'}
      placeholder={placeholder || ''}
      onChange={onChange}
      name={name || 'ace-editor'}
      value={value}
      editorProps={{$blockScrolling: true}}
      fontSize='14px'
      showGutter={true}
      highlightActiveLine={true}
      showPrintMargin={false}
      setOptions={{
        // 基础的自动完成
        enableBasicAutocompletion: true,
        // 实时自动完成
        enableLiveAutocompletion: true,
        // 代码块
        enableSnippets: true,
        // 显示行号
        showLineNumbers: true,
        // 用户输入的sql语句，自动换行
        wrap: true

      }}
    />
  </>);
}

export default React.memo(CodeEditor);

