def chunks(list_x, n, list_y=None, list_y2=None):
    for i in range(0, len(list_x), n):
        if not list_y:
            yield (list_x[i:i+n])
        elif not list_y2:
            yield (list_x[i:i+n], list_y[i:i+n])
        else:
            yield (list_x[i:i+n], list_y[i:i+n], list_y2[i:i+n])
