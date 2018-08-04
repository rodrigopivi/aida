
def build_dictionary(dict_json):
    dict_cache = {
        'ID_TO_WORD_MAP': {},
        'WORD_TO_ID_MAP': {},
        'PRETRAINED': {},
    }
    dict_cache['PRETRAINED'] = dict((key, val) for key, val in dict_json)
    for idx, key_val_tupl in enumerate(dict_json):
        dict_cache['ID_TO_WORD_MAP'][idx] = key_val_tupl[0]
        dict_cache['WORD_TO_ID_MAP'][key_val_tupl[0]] = idx
    return dict_cache


def chunks(list_x, n, list_y=None, list_y2=None):
    for i in range(0, len(list_x), n):
        if not list_y:
            yield (list_x[i:i+n])
        elif not list_y2:
            yield (list_x[i:i+n], list_y[i:i+n])
        else:
            yield (list_x[i:i+n], list_y[i:i+n], list_y2[i:i+n])
