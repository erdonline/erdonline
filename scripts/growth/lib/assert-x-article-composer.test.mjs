import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  assertXArticleEditUrl,
  assertXArticleHubUrl,
  assertXArticleUrl,
  assertXArticleUrlOrThrow,
  isXArticleEditUrl,
  isXArticleHubUrl,
  X_ARTICLE_EDIT_URL_RE,
  X_ARTICLE_HUB_URL_RE,
} from './assert-x-article-composer.mjs';

describe('X Article URL gates', () => {
  it('throws on compose/post', () => {
    assert.throws(
      () => assertXArticleUrl('https://x.com/compose/post'),
      /compose\/post/,
    );
    assert.throws(
      () => assertXArticleUrlOrThrow('https://x.com/compose/post'),
      /compose\/post/,
    );
    assert.throws(() => assertXArticleHubUrl('https://x.com/compose/post'), /compose\/post/);
    assert.throws(() => assertXArticleEditUrl('https://x.com/compose/post'), /compose\/post/);
  });

  it('hub OK pre-create only', () => {
    assert.doesNotThrow(() => assertXArticleHubUrl('https://x.com/compose/articles'));
    assert.ok(isXArticleHubUrl('https://x.com/compose/articles'));
    assert.throws(() => assertXArticleEditUrl('https://x.com/compose/articles'), /hub/);
  });

  it('edit URL OK for typing', () => {
    const url = 'https://x.com/compose/articles/edit/2093728235884605440';
    assert.match(url, X_ARTICLE_EDIT_URL_RE);
    assert.ok(isXArticleEditUrl(url));
    assert.doesNotThrow(() => assertXArticleEditUrl(url));
    assert.throws(() => assertXArticleHubUrl(url));
  });

  it('public viewer not composer', () => {
    const url = 'https://x.com/BuilderLiang/article/2093670417458491425';
    assert.throws(() => assertXArticleEditUrl(url), /viewer|edit/);
    assert.throws(() => assertXArticleHubUrl(url));
  });

  it('hub regex does not match edit path', () => {
    assert.ok(X_ARTICLE_HUB_URL_RE.test('https://x.com/compose/articles'));
    assert.ok(!X_ARTICLE_HUB_URL_RE.test('https://x.com/compose/articles/edit/123'));
  });
});
