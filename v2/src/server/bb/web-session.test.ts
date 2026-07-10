import { describe, it, expect } from 'vitest';
import { collectHiddenFields, collectFormFields } from './web-session';

const html = `
<input type="hidden" name="__VIEWSTATE" id="__VIEWSTATE" value="abc123" />
<input type="hidden" name="__EVENTVALIDATION" value="ev456" />
<input type="hidden" name="ctl00$cphContent$hdnPage" id="cphContent_hdnPage" value="3" />
<select name="ctl00$cphContent$ddlPotentialMin">
  <option value="0"></option>
  <option selected="selected" value="6">allstar</option>
</select>
<select name="ctl00$cphContent$ddlCountry">
  <option value=""></option>
</select>
<input name="ctl00$cphContent$tbMinAge" type="text" value="18" />
<input name="ctl00$cphContent$tbMaxAge" type="text" />
`;

describe('collectHiddenFields', () => {
  const h = collectHiddenFields(html);
  it('collects ASP.NET state fields', () => {
    expect(h.__VIEWSTATE).toBe('abc123');
    expect(h.__EVENTVALIDATION).toBe('ev456');
  });
  it('collects content hidden fields like hdnPage', () => {
    expect(h['ctl00$cphContent$hdnPage']).toBe('3');
  });
});

describe('collectFormFields', () => {
  const f = collectFormFields(html);
  it('uses the selected option', () => expect(f['ctl00$cphContent$ddlPotentialMin']).toBe('6'));
  it('falls back to first option', () => expect(f['ctl00$cphContent$ddlCountry']).toBe(''));
  it('keeps text input values, empty when absent', () => {
    expect(f['ctl00$cphContent$tbMinAge']).toBe('18');
    expect(f['ctl00$cphContent$tbMaxAge']).toBe('');
  });
});
