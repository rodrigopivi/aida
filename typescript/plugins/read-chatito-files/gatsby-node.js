async function onCreateNode({ node, actions, loadNodeContent }) {
    const { createNodeField } = actions;
    if (node.extension !== `chatito`) { return; }
    const content = await loadNodeContent(node);
    createNodeField({ node, name: 'chatitoDSL', value: content })
    return;
}

exports.onCreateNode = onCreateNode;
