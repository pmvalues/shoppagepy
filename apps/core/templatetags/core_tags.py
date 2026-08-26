from django import template

register = template.Library()

@register.filter
def get_item(dictionary, key):
    """
    Template filter to look up a key dynamically from a dictionary.
    Usage: {{ dict|get_item:key }}
    """
    if isinstance(dictionary, dict):
        return dictionary.get(key)
    return None

@register.filter
def mul(value, arg):
    """Multiplies value by arg."""
    try:
        return float(value) * float(arg)
    except (ValueError, TypeError):
        return ''

@register.filter
def div(value, arg):
    """Divides value by arg."""
    try:
        return float(value) / float(arg)
    except (ValueError, TypeError, ZeroDivisionError):
        return ''
