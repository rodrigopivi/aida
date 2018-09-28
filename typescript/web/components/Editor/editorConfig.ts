export interface IEditorTabs {
    title: string;
    value: string;
}

export const chatitoPrism = {
    comments: [{ pattern: /^\/\/.*/, greedy: true }, { pattern: /((\n|\r\n)+)\/\/.*/, greedy: true }],
    intentDefinition: [
        {
            pattern: /^%\[[^\]]+\]((\(.+\))?)/,
            inside: { intentArguments: /((\(.+\))?)$/ }
        },
        {
            pattern: /((\n|\r\n)+)%\[[^\]]+\]((\(.+\))?)/,
            inside: { intentArguments: /((\(.+\))?)$/ }
        }
    ],
    slotDefinition: [
        {
            pattern: /^\@\[[^\]]+\]((\(.+\))?)/,
            inside: { slotArguments: /((\(.+\))?)$/ }
        },
        {
            pattern: /((\n|\r\n)+)\@\[[^\]]+\]((\(.+\))?)/,
            inside: { slotArguments: /((\(.+\))?)$/ }
        }
    ],
    slot: { pattern: /\@\[[^\]]+(\?)?\]/, greedy: true },
    alias: { pattern: /~\[[^\]]+(\?)?\]/, greedy: true },
    default: { pattern: /[^\r\n]/i, greedy: true }
};
